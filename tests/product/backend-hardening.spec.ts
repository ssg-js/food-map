import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
const origin = "http://127.0.0.1:3300";
let db: PrismaClient;
test.beforeEach(async () => {
  const env = JSON.parse(
    await readFile("/private/tmp/food-map-product-test-env.json", "utf8"),
  );
  const url = new URL(env.DATABASE_URL);
  if (
    !["localhost", "127.0.0.1"].includes(url.hostname) ||
    !url.searchParams.get("schema")?.startsWith("product_test_")
  )
    throw new Error("Requires isolated test database");
  db = new PrismaClient({ datasourceUrl: env.DATABASE_URL });
  await db.loginAttempt.deleteMany();
});
test.afterEach(async () => {
  await db.loginAttempt.deleteMany();
  await db.$disconnect();
});
test("random usernames share a global persisted cap without arbitrary attempt rows", async ({
  request,
}) => {
  const data = (i: number) => ({
    username: `missing_audit_${i}`,
    password: "Definitely-not-password-123",
  });
  for (let i = 0; i < 3; i++)
    expect(
      (
        await request.post("/api/auth/login", {
          headers: { Origin: origin },
          data: data(i),
        })
      ).status(),
    ).toBe(401);
  expect(await db.loginAttempt.count()).toBe(1);
  await db.loginAttempt.updateMany({ data: { count: 100 } });
  const blocked = await request.post("/api/auth/login", {
    headers: { Origin: origin },
    data: data(99),
  });
  expect(blocked.status()).toBe(429);
  expect(blocked.headers()["cache-control"]).toContain("private, no-store");
  expect(await db.loginAttempt.count()).toBe(1);
});
test("catalog mutations and validation failures explicitly forbid caching", async ({
  request,
}) => {
  expect(
    (
      await request.post("/api/auth/login", {
        headers: { Origin: origin },
        data: { username: "testa", password: "Test-password-12345" },
      })
    ).status(),
  ).toBe(200);
  const created = await request.post("/api/categories", {
    headers: { Origin: origin },
    data: { name: `감사${Date.now()}`.slice(0, 20), kind: "DISH" },
  });
  expect(created.status()).toBe(201);
  expect(created.headers()["cache-control"]).toContain("private, no-store");
  const category = await created.json();
  const invalid = await request.patch(`/api/categories/${category.id}`, {
    headers: { Origin: origin },
    data: {},
  });
  expect(invalid.status()).toBe(400);
  expect(invalid.headers()["cache-control"]).toContain("private, no-store");
  const removed = await request.delete(
    `/api/categories/${category.id}?${new URLSearchParams({ version: category.updatedAt })}`,
    { headers: { Origin: origin } },
  );
  expect(removed.status()).toBe(204);
  expect(removed.headers()["cache-control"]).toContain("private, no-store");
});

test("oversized login JSON is rejected before authentication or attempt writes", async ({
  request,
}) => {
  const result = await request.post("/api/auth/login", {
    headers: { Origin: origin },
    data: { username: "testa", password: "x".repeat(70 * 1024) },
  });
  expect(result.status()).toBe(413);
  expect((await result.json()).code).toBe("REQUEST_TOO_LARGE");
  expect(result.headers()["cache-control"]).toContain("private, no-store");
  expect(await db.loginAttempt.count()).toBe(0);
});
