import { test, expect, type APIRequestContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { readFile } from "node:fs/promises";
const origin = "http://127.0.0.1:3300",
  original = "Original-password-12345",
  next = "Updated-password-12345";
let db: PrismaClient, userId: string, username: string;
const headers = { Origin: origin };
async function login(api: APIRequestContext, password = original) {
  return api.post("/api/auth/login", { headers, data: { username, password } });
}
async function issue(api: APIRequestContext) {
  const r = await api.post("/api/account/security", {
    headers,
    data: { action: "issue-key", currentPassword: original },
  });
  expect(r.status(), await r.text()).toBe(200);
  return (await r.json()).recoveryKey as string;
}
async function recover(
  api: APIRequestContext,
  key: string,
  action = "find-username",
) {
  return api.post("/api/auth/recover", {
    headers,
    data: { action, recoveryKey: key, newPassword: next, confirmation: next },
  });
}
test.beforeEach(async () => {
  const env = JSON.parse(
    await readFile("/private/tmp/food-map-product-test-env.json", "utf8"),
  );
  db = new PrismaClient({ datasourceUrl: env.DATABASE_URL });
  userId = `security-${Date.now()}`;
  username = `sec${Date.now()}`;
  await db.loginAttempt.deleteMany();
  await db.user.create({
    data: {
      id: userId,
      name: username,
      username,
      email: `${username}@local.invalid`,
      role: "USER",
    },
  });
  await db.account.create({
    data: {
      id: `credential-${userId}`,
      userId,
      accountId: userId,
      providerId: "credential",
      password: await hashPassword(original),
    },
  });
});
test.afterEach(async () => {
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});
test("recovery key is hashed, current-password gated, rotated and account scoped", async ({
  request,
}) => {
  expect((await request.get("/api/account/security")).status()).toBe(401);
  expect(
    (
      await request.post("/api/account/security", {
        headers,
        data: { action: "issue-key", currentPassword: original },
      })
    ).status(),
  ).toBe(401);
  expect((await login(request)).status()).toBe(200);
  expect(
    (
      await request.post("/api/account/security", {
        headers: { Origin: "https://evil.example" },
        data: { action: "issue-key", currentPassword: original },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/account/security", {
        headers,
        data: { action: "issue-key", currentPassword: "wrong" },
      })
    ).status(),
  ).toBe(400);
  const key = await issue(request);
  expect(key).toMatch(/^FM-[A-F0-9]{64}$/);
  const stored = await db.recoveryKey.findUniqueOrThrow({ where: { userId } });
  expect(stored.keyHash).not.toBe(key);
  expect(stored.keyHash).toHaveLength(64);
  const status = await request.get("/api/account/security");
  expect(status.headers()["cache-control"]).toContain("no-store");
  expect(await status.text()).not.toContain(key);
  expect((await recover(request, key)).status()).toBe(200);
  expect((await (await recover(request, key)).json()).username).toBe(username);
  const replacement = await issue(request);
  expect(replacement).not.toBe(key);
  expect((await recover(request, key)).status()).toBe(400);
  expect((await recover(request, replacement)).status()).toBe(200);
  expect(
    (
      await request.post("/api/auth/recover", {
        headers: { Origin: "https://evil.example" },
        data: { action: "find-username", recoveryKey: replacement },
      })
    ).status(),
  ).toBe(403);
});
test("password change verifies current password and revokes all sessions and old key", async ({
  request,
  playwright,
}) => {
  await login(request);
  const key = await issue(request);
  const native = await playwright.request.newContext({ baseURL: origin });
  const sign = await native.post("/api/auth/login", {
    headers: { "x-food-map-client": "native" },
    data: { username, password: original },
  });
  const token = (await sign.json()).token;
  const body = {
    action: "change-password",
    currentPassword: original,
    newPassword: next,
    confirmation: next,
  };
  expect(
    (
      await request.post("/api/account/security", {
        headers,
        data: { ...body, currentPassword: "wrong" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/account/security", {
        headers,
        data: { ...body, confirmation: "wrong" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/account/security", { headers, data: body })
    ).status(),
  ).toBe(200);
  expect((await request.get("/api/categories")).status()).toBe(401);
  expect(
    (
      await native.get("/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).status(),
  ).toBe(401);
  expect((await recover(request, key)).status()).toBe(400);
  expect((await login(request)).status()).toBe(401);
  expect((await login(request, next)).status()).toBe(200);
  await native.dispose();
});
test("reset consumes recovery key atomically, keeps other account intact and rejects replay", async ({
  request,
}) => {
  await login(request);
  const key = await issue(request);
  const baseline = await db.account.findFirstOrThrow({
    where: { userId: "testb", providerId: "credential" },
    select: { password: true },
  });
  const result = await Promise.all(
    [1, 2].map(() => recover(request, key, "reset-password")),
  );
  expect(result.map((r) => r.status()).sort()).toEqual([200, 400]);
  expect((await request.get("/api/categories")).status()).toBe(401);
  expect((await recover(request, key)).status()).toBe(400);
  expect((await login(request)).status()).toBe(401);
  expect((await login(request, next)).status()).toBe(200);
  expect(
    (
      await db.account.findFirstOrThrow({
        where: { userId: "testb", providerId: "credential" },
      })
    ).password,
  ).toBe(baseline.password);
});
test("web screens issue key, find username and reset password without email", async ({
  page,
}, info) => {
  await login(page.request);
  await page.goto("/account/security");
  await expect(page.getByRole("heading", { name: "계정 보안" })).toBeVisible();
  await page.getByLabel("현재 비밀번호", { exact: true }).fill(original);
  await page.getByRole("button", { name: "복구 키 발급·재발급" }).click();
  const key = await page.locator("code").innerText();
  expect(key).toMatch(/^FM-/);
  await page.getByRole("button", { name: "보관했어요" }).click();
  await expect(page.locator("code")).toHaveCount(0);
  await page.request.post("/api/auth/logout", { headers });
  await page.goto("/login");
  await page.getByRole("link", { name: "아이디·비밀번호 찾기" }).click();
  await expect(page).toHaveURL(/\/recover$/);
  await page.getByLabel("복구 키", { exact: true }).fill(key);
  await page.getByRole("button", { name: "아이디 확인" }).click();
  await expect(page.getByRole("status")).toContainText(username);
  await page.getByLabel("새 비밀번호", { exact: true }).fill(next);
  await page.getByLabel("새 비밀번호 확인", { exact: true }).fill(next);
  await page
    .getByRole("button", { name: "비밀번호 재설정", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("비밀번호를 변경했어요");
  await page.screenshot({
    path: `docs/screenshots/account-recovery-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "로그인으로 돌아가기" }).click();
  await page.getByLabel("아이디", { exact: true }).fill(username);
  await page.getByLabel("비밀번호", { exact: true }).fill(next);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL(/\/map$/);
});
test("unknown recovery keys are rate limited", async ({ request }) => {
  const key = "FM-" + "A".repeat(64);
  for (let i = 0; i < 20; i++)
    expect((await recover(request, key)).status()).toBe(400);
  expect((await recover(request, key)).status()).toBe(429);
});

test("concurrent old-password sign-ins cannot survive a reset", async ({
  request,
  playwright,
}) => {
  await login(request);
  const key = await issue(request);
  const client = await playwright.request.newContext({ baseURL: origin });
  const results = await Promise.all([
    recover(request, key, "reset-password"),
    ...Array.from({ length: 8 }, () =>
      client.post("/api/auth/login", {
        headers: { "x-food-map-client": "native" },
        data: { username, password: original },
      }),
    ),
  ]);
  expect(results[0].status()).toBe(200);
  for (const r of results.slice(1)) {
    expect([200, 401]).toContain(r.status());
    if (r.status() === 200) {
      const { token } = await r.json();
      expect(
        (
          await client.get("/api/categories", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ).status(),
      ).toBe(401);
    }
  }
  expect((await login(request, next)).status()).toBe(200);
  await client.dispose();
});
