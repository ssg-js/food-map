import { test, expect, type Page } from "@playwright/test";
const key = "product-test-only-access-key-0123456789",
  origin = "http://127.0.0.1:3300";
async function login(page: Page) {
  await page.goto("/admin/api-usage");
  await page.getByLabel("관리자 접근 키", { exact: true }).fill(key);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "API 사용량", exact: true }),
  ).toBeVisible();
}
test("admin login, real database dashboard, unauthorized APIs and logout", async ({
  page,
}, testInfo) => {
  expect((await page.request.get("/api/admin/usage")).status()).toBe(401);
  await login(page);
  await expect(
    page.getByText("검색 한도 보호 중", { exact: true }),
  ).toBeVisible();
  const usage = await page.request.get("/api/admin/usage");
  expect(usage.ok()).toBeTruthy();
  expect(usage.headers()["cache-control"]).toContain("no-store");
  await page.screenshot({
    path: `docs/screenshots/admin-dashboard-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "관리자 로그인" }),
  ).toBeVisible();
  expect((await page.request.get("/api/admin/usage")).status()).toBe(401);
});
test("saved list and filters use actual API/DB, map selection keeps Place ID", async ({
  page,
}, testInfo) => {
  await page.route("https://maps.googleapis.com/maps/api/js?*", (r) =>
    r.fulfill({
      body: `window.google={maps:{Map:class{constructor(e,o){this.c=o.center;this.z=o.zoom}setCenter(c){this.c=c}getCenter(){return {lat:()=>this.c.lat,lng:()=>this.c.lng}}setZoom(z){this.z=z}getZoom(){return this.z}panTo(c){this.c=c}getBounds(){return null}},Marker:class{setMap(){}setPosition(){}setTitle(){}addListener(){return {remove(){}}}},event:{addListener(){return {remove(){}}}}}};`,
      contentType: "application/javascript",
    }),
  );
  await page.goto("/saved");
  await expect(
    page.getByRole("heading", { name: "소담 파스타", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "3곳 저장됨" })).toBeVisible();
  const filters = page.getByRole("region", { name: "저장한 맛집 필터" });
  await filters.getByRole("button", { name: "파스타", exact: true }).click();
  await expect(page.getByRole("heading", { name: "2곳 저장됨" })).toBeVisible();
  await filters.getByRole("button", { name: "데이트", exact: true }).click();
  await expect(page.getByRole("heading", { name: "1곳 저장됨" })).toBeVisible();
  await page
    .getByRole("button", { name: "지도에서 보기", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "소담 파스타 지도", exact: true }),
  ).toHaveAttribute("data-map-status", "ready");
  await expect(
    page.getByRole("region", { name: "소담 파스타 지도", exact: true }),
  ).toHaveAttribute("data-latitude", "37.5445");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `docs/screenshots/saved-restaurants-${testInfo.project.name}.png`,
    fullPage: true,
  });
});
test("restaurant writes require operator and stale updates do not overwrite", async ({
  page,
}) => {
  const name = `crud-${Date.now()}`;
  const created = await page.request.post("/api/restaurants", {
    data: { googlePlaceId: name, categoryIds: ["fixture-food"] },
  });
  expect(created.ok()).toBeTruthy();
  const item = await created.json();
  expect(
    (
      await page.request.patch(`/api/restaurants/${item.id}`, {
        data: { categoryIds: [], expectedUpdatedAt: item.updatedAt },
        headers: { Origin: origin },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await page.request.post("/api/restaurants", {
        data: { googlePlaceId: name, categoryIds: [] },
        headers: { Origin: origin },
      })
    ).status(),
  ).toBe(401);
  await login(page);
  const update = await page.request.patch(`/api/restaurants/${item.id}`, {
    data: {
      categoryIds: ["fixture-purpose"],
      expectedUpdatedAt: item.updatedAt,
    },
    headers: { Origin: origin },
  });
  expect(update.ok()).toBeTruthy();
  const latest = await update.json();
  expect(latest.categories.map((c: { id: string }) => c.id)).toEqual([
    "fixture-purpose",
  ]);
  expect(
    (
      await page.request.patch(`/api/restaurants/${item.id}`, {
        data: { categoryIds: [], expectedUpdatedAt: item.updatedAt },
        headers: { Origin: origin },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await page.request.delete(
        `/api/restaurants/${item.id}?version=${encodeURIComponent(item.updatedAt)}`,
        { headers: { Origin: origin } },
      )
    ).status(),
  ).toBe(409);
  expect(
    (
      await page.request.delete(
        `/api/restaurants/${item.id}?version=${encodeURIComponent(latest.updatedAt)}`,
        { headers: { Origin: origin } },
      )
    ).status(),
  ).toBe(204);
});
test("category manager edits, classifies legacy and deletes without deleting restaurants", async ({
  page,
}) => {
  const name = `관리-${Date.now()}`;
  const created = await page.request.post("/api/categories", {
    data: { name, kind: "FOOD" },
  });
  expect(created.ok()).toBeTruthy();
  const category = await created.json();
  const linked = await (
    await page.request.post("/api/restaurants", {
      data: {
        googlePlaceId: `category-link-${Date.now()}`,
        categoryIds: [category.id],
      },
    })
  ).json();
  await login(page);
  await page.goto("/categories");
  const row = page
    .locator("article")
    .filter({ has: page.getByText(name, { exact: true }) });
  await row.getByRole("button", { name: "이름·분류 수정" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("카테고리 이름").fill(name + "변경");
  await dialog.getByLabel("분류", { exact: true }).selectOption("PURPOSE");
  await dialog.getByRole("button", { name: "변경 저장" }).click();
  await expect(dialog).not.toBeVisible();
  const cats = (await (await page.request.get("/api/categories")).json()).items;
  const current = cats.find((c: { id: string }) => c.id === category.id);
  expect(current.kind).toBe("PURPOSE");
  expect(
    (
      await page.request.patch(`/api/categories/${category.id}`, {
        data: { name, kind: "FOOD", expectedUpdatedAt: category.updatedAt },
        headers: { Origin: origin },
      })
    ).status(),
  ).toBe(409);
  const newrow = page
    .locator("article")
    .filter({ has: page.getByText(name + "변경", { exact: true }) });
  await newrow.getByRole("button", { name: "삭제", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "삭제 확인" })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const preserved = await (
    await page.request.get(`/api/restaurants?placeId=${linked.googlePlaceId}`)
  ).json();
  expect(preserved.id).toBe(linked.id);
  expect(preserved.categories).toEqual([]);
  expect(
    (
      await page.request.delete(
        `/api/restaurants/${linked.id}?version=${encodeURIComponent(preserved.updatedAt)}`,
        { headers: { Origin: origin } },
      )
    ).status(),
  ).toBe(204);
  expect(
    (await (await page.request.get("/api/restaurants?page=1")).json()).total,
  ).toBe(3);
});
