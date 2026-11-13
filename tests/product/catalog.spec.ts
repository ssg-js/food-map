import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { test, expect, type APIRequestContext } from "@playwright/test";
const origin = "http://127.0.0.1:3300";
async function login(api: APIRequestContext, username = "testa") {
  const r = await api.post("/api/auth/login", {
    data: { username, password: "Test-password-12345" },
    headers: { Origin: origin },
  });
  expect(r.status(), await r.text()).toBe(200);
}
async function category(api: APIRequestContext, kind = "DISH") {
  const r = await api.post("/api/categories", {
    headers: { Origin: origin },
    data: { name: `test-${Date.now()}`, kind },
  });
  expect(r.status()).toBe(201);
  return r.json();
}
test("anonymous data and search denied; public signup and legacy admin key disabled", async ({
  request,
}) => {
  for (const path of [
    "/api/categories",
    "/api/restaurants?page=1",
    "/api/places/search?q=돈카츠",
    "/api/places/mock-seongsu-cutlet",
  ]) {
    expect((await request.get(path)).status()).toBe(401);
  }
  expect(
    (await request.post("/api/auth/sign-up/email", { data: {} })).status(),
  ).toBe(404);
  expect(
    (
      await request.post("/api/admin/session", {
        data: { key: "product-test-only-access-key-0123456789" },
      })
    ).status(),
  ).toBe(410);
});
test("real password login, CSRF rejection, session revocation and no email field", async ({
  page,
}) => {
  await page.goto("/login");
  expect(await page.getByLabel("아이디", { exact: true }).count()).toBe(1);
  expect(await page.locator("input[type=email]").count()).toBe(0);
  expect(
    (
      await page.request.post("/api/auth/login", {
        headers: { Origin: origin },
        data: { username: "testa", password: "bad" },
      })
    ).status(),
  ).toBe(401);
  await login(page.request);
  const s = await (await page.request.get("/api/auth/session")).json();
  expect(s.user.username).toBe("testa");
  expect(s.user.email).toBeUndefined();
  expect(
    (
      await page.request.post("/api/categories", {
        headers: { Origin: "https://evil.example" },
        data: { name: "x", kind: "DISH" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await page.request.post("/api/auth/logout", {
        headers: { Origin: origin },
      })
    ).status(),
  ).toBe(200);
  expect((await page.request.get("/api/restaurants?page=1")).status()).toBe(
    401,
  );
});
test("native bearer login and role enforcement", async ({ playwright }) => {
  const ctx = await playwright.request.newContext({ baseURL: origin });
  const r = await ctx.post("/api/auth/login", {
    headers: { "x-food-map-client": "native" },
    data: { username: "testb", password: "Test-password-12345" },
  });
  expect(r.status(), await r.text()).toBe(200);
  const { token } = await r.json();
  expect(token).toBeTruthy();
  const native = await playwright.request.newContext({
    baseURL: origin,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
  expect((await native.get("/api/categories")).status()).toBe(200);
  expect((await native.get("/api/admin/usage")).status()).toBe(401);
  expect((await native.post("/api/auth/logout")).status()).toBe(200);
  expect((await native.get("/api/categories")).status()).toBe(401);
  await native.dispose();
  await ctx.dispose();
});
test("owner isolation, category rules, conflict and safe delete", async ({
  request,
  playwright,
}) => {
  await login(request);
  const cat = await category(request),
    food = await category(request, "FOOD");
  const other = await playwright.request.newContext({ baseURL: origin });
  await login(other, "testb");
  const placeId = `personal-${Date.now()}`;
  expect(
    (
      await request.post("/api/restaurants", {
        headers: { Origin: origin },
        data: { googlePlaceId: placeId, categoryIds: [] },
      })
    ).status(),
  ).toBe(400);
  const saved = await request.post("/api/restaurants", {
    headers: { Origin: origin },
    data: { googlePlaceId: placeId, categoryIds: [cat.id] },
  });
  expect(saved.status(), await saved.text()).toBe(200);
  const item = await saved.json();
  expect(
    await (await other.get(`/api/restaurants?placeId=${placeId}`)).json(),
  ).toBeNull();
  expect(
    (await (await other.get("/api/categories")).json()).items.some(
      (c: { id: string }) => c.id === cat.id,
    ),
  ).toBe(false);
  expect(
    (
      await other.patch(`/api/restaurants/${item.id}`, {
        headers: { Origin: origin },
        data: { categoryIds: [cat.id], expectedUpdatedAt: item.updatedAt },
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await other.patch(`/api/categories/${cat.id}`, {
        headers: { Origin: origin },
        data: {
          name: "stolen",
          kind: "DISH",
          expectedUpdatedAt: cat.updatedAt,
        },
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await other.post("/api/restaurants", {
        headers: { Origin: origin },
        data: { googlePlaceId: placeId, categoryIds: [cat.id] },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.delete(
        `/api/categories/${cat.id}?version=${cat.updatedAt}`,
        { headers: { Origin: origin } },
      )
    ).status(),
  ).toBe(409);
  const changed = await request.patch(`/api/restaurants/${item.id}`, {
    headers: { Origin: origin },
    data: { categoryIds: [cat.id, food.id], expectedUpdatedAt: item.updatedAt },
  });
  expect(changed.status()).toBe(200);
  expect(
    (
      await request.patch(`/api/restaurants/${item.id}`, {
        headers: { Origin: origin },
        data: { categoryIds: [food.id], expectedUpdatedAt: item.updatedAt },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.delete(
        `/api/categories/${cat.id}?version=${cat.updatedAt}`,
        { headers: { Origin: origin } },
      )
    ).status(),
  ).toBe(204);
  const own = await (
    await request.get(`/api/restaurants?placeId=${placeId}`)
  ).json();
  expect(own.categories.map((c: { id: string }) => c.id)).toEqual([food.id]);
  expect(
    (
      await other.delete(
        `/api/restaurants/${item.id}?version=${own.updatedAt}`,
        { headers: { Origin: origin } },
      )
    ).status(),
  ).toBe(404);
  expect(
    (
      await request.delete(
        `/api/restaurants/${item.id}?version=${own.updatedAt}`,
        { headers: { Origin: origin } },
      )
    ).status(),
  ).toBe(204);
  await other.dispose();
});
test("mock Google search, three-group filter, map and responsive UI", async ({
  page,
}, info) => {
  await login(page.request);
  const food = await category(page.request, "FOOD"),
    dish = await category(page.request, "DISH"),
    purpose = await category(page.request, "PURPOSE");
  const pasta = "mock-seongsu-pasta";
  const previousPasta = await (
    await page.request.get(`/api/restaurants?placeId=${pasta}`)
  ).json();
  expect(
    (
      await page.request.post("/api/restaurants", {
        headers: { Origin: origin },
        data: {
          googlePlaceId: pasta,
          categoryIds: [food.id, purpose.id],
          expectedUpdatedAt: previousPasta?.updatedAt,
        },
      })
    ).status(),
  ).toBe(200);
  const id = "mock-seongsu-cutlet";
  const old = await (
    await page.request.get(`/api/restaurants?placeId=${id}`)
  ).json();
  expect(
    (
      await page.request.post("/api/restaurants", {
        headers: { Origin: origin },
        data: {
          googlePlaceId: id,
          categoryIds: [food.id, dish.id, purpose.id],
          expectedUpdatedAt: old?.updatedAt,
        },
      })
    ).status(),
  ).toBe(200);
  const query = await page.request.get(
    `/api/restaurants?page=1&food=${food.id}&dish=${dish.id}&purpose=${purpose.id}&q=${encodeURIComponent(dish.name)}`,
  );
  expect((await query.json()).total).toBe(1);
  const external: string[] = [];
  page.on("request", (r) => {
    if (/googleapis|gstatic/.test(r.url())) external.push(r.url());
  });
  await page.goto("/map");
  await page.getByLabel("대표 메뉴로 찾기", { exact: true }).fill("돈카츠");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(
    page.getByText("모의 돈카츠 성수점", { exact: true }).first(),
  ).toBeVisible();
  await page.goto("/saved");
  await expect(
    page.getByRole("heading", {
      name: "모의 돈카츠 성수점",
      exact: true,
      level: 2,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "모의 돈카츠 성수점 핀", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "모의 파스타 성수점 핀", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "모의 파스타 성수점 지도", exact: true }),
  ).toBeVisible();
  expect(external).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `docs/screenshots/personal-saved-${info.project.name}.png`,
    fullPage: true,
  });
  await page.goto("/admin/api-usage");
  await expect(
    page.getByText("모의 API · 유료 호출 없음", { exact: true }),
  ).toBeVisible();
});

test("atomic shared query cap includes details and returns reset time", async ({
  request,
  page,
}) => {
  await login(request);
  const env = JSON.parse(
    await readFile("/private/tmp/food-map-product-test-env.json", "utf8"),
  );
  const db = new PrismaClient({ datasourceUrl: env.DATABASE_URL });
  try {
    const [clock] = await db.$queryRaw<
      { day: string }[]
    >`SELECT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles','YYYY-MM-DD') AS day`;
    const id = `mock:ALL:global:${clock.day}`;
    await db.apiUsage.upsert({
      where: { id },
      create: {
        id,
        mode: "mock",
        api: "ALL",
        scope: "global",
        period: clock.day,
        count: 78,
      },
      update: { count: 78 },
    });
    const rs = await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        request.get(
          i % 2
            ? "/api/places/mock-seongsu-cutlet"
            : "/api/places/search?q=돈카츠",
        ),
      ),
    );
    expect(rs.filter((r) => r.status() === 200)).toHaveLength(2);
    expect(rs.filter((r) => r.status() === 429)).toHaveLength(10);
    expect((await db.apiUsage.findUniqueOrThrow({ where: { id } })).count).toBe(
      80,
    );
    const blocked = await rs.find((r) => r.status() === 429)!.json();
    expect(blocked.code).toBe("SEARCH_LIMIT_REACHED");
    expect(Date.parse(blocked.resetAt)).toBeGreaterThan(Date.now());
    await login(page.request);
    await page.goto("/map");
    await page.getByLabel("대표 메뉴로 찾기", { exact: true }).fill("돈카츠");
    await page.getByRole("button", { name: "검색", exact: true }).click();
    await expect(
      page.getByRole("dialog", { name: "검색을 잠시 중단했어요" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "확인", exact: true }).click();
    await expect(
      page.getByLabel("대표 메뉴로 찾기", { exact: true }),
    ).toHaveValue("돈카츠");
  } finally {
    await db.apiUsage.updateMany({
      where: { mode: "mock", api: "ALL" },
      data: { count: 0 },
    });
    await db.$disconnect();
  }
});

test("one-time private account setup preserves explicitly adopted legacy data", async ({
  request,
}) => {
  const env = JSON.parse(
    await readFile("/private/tmp/food-map-product-test-env.json", "utf8"),
  );
  const db = new PrismaClient({ datasourceUrl: env.DATABASE_URL });
  const { hashPassword } = await import("better-auth/crypto");
  try {
    await db.user.deleteMany();
    await db.bootstrapState.update({
      where: { id: "personal" },
      data: { state: "READY" },
    });
    await db.user.create({
      data: {
        id: "__legacy_quarantine__",
        name: "Legacy",
        email: "legacy@local.invalid",
        role: "QUARANTINED",
      },
    });
    await db.category.create({
      data: {
        id: "legacy-category",
        ownerId: "__legacy_quarantine__",
        name: "분류 전",
        kind: "UNCLASSIFIED",
      },
    });
    await db.restaurant.create({
      data: {
        id: "legacy-restaurant",
        ownerId: "__legacy_quarantine__",
        googlePlaceId: "legacy-place",
      },
    });
    await db.restaurantCategory.create({
      data: {
        ownerId: "__legacy_quarantine__",
        restaurantId: "legacy-restaurant",
        categoryId: "legacy-category",
      },
    });
    const payload = {
      token: env.PERSONAL_SETUP_TOKEN,
      username: "newowner",
      password: "Owner-password-12345",
      adoptLegacy: true,
    };
    expect(
      (
        await request.post("/api/auth/setup", {
          headers: { Origin: origin },
          data: { ...payload, token: "wrong" },
        })
      ).status(),
    ).toBe(400);
    const results = await Promise.all(
      [1, 2].map(() =>
        request.post("/api/auth/setup", {
          headers: { Origin: origin },
          data: payload,
        }),
      ),
    );
    expect(results.map((r) => r.status()).sort()).toEqual([201, 409]);
    const owner = await db.user.findUniqueOrThrow({
      where: { username: "newowner" },
    });
    expect(owner.role).toBe("OPERATOR");
    expect(
      (
        await db.restaurant.findUniqueOrThrow({
          where: { id: "legacy-restaurant" },
        })
      ).ownerId,
    ).toBe(owner.id);
    expect((await db.restaurantCategory.findFirstOrThrow()).ownerId).toBe(
      owner.id,
    );
    expect(
      (
        await request.post("/api/auth/setup", {
          headers: { Origin: origin },
          data: payload,
        })
      ).status(),
    ).toBe(409);
    expect(
      (
        await request.post("/api/auth/login", {
          headers: { Origin: origin },
          data: { username: payload.username, password: payload.password },
        })
      ).status(),
    ).toBe(200);
    const legacy = await (
      await request.get("/api/restaurants?placeId=legacy-place")
    ).json();
    expect(legacy.id).toBe("legacy-restaurant");
    expect(
      (
        await request.patch("/api/restaurants/legacy-restaurant", {
          headers: { Origin: origin },
          data: {
            categoryIds: ["legacy-category"],
            expectedUpdatedAt: legacy.updatedAt,
          },
        })
      ).status(),
    ).toBe(400);
  } finally {
    await db.user.deleteMany();
    for (const [id, role] of [
      ["testa", "OPERATOR"],
      ["testb", "USER"],
    ]) {
      await db.user.create({
        data: {
          id,
          name: id,
          username: id,
          email: `${id}@local.invalid`,
          role,
        },
      });
      await db.account.create({
        data: {
          id: `account-${id}`,
          accountId: id,
          providerId: "credential",
          userId: id,
          password: await hashPassword("Test-password-12345"),
        },
      });
    }
    await db.bootstrapState.update({
      where: { id: "personal" },
      data: { state: "DONE" },
    });
    await db.$disconnect();
  }
});
