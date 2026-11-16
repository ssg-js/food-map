import { test, expect, type Page } from "@playwright/test";
const origin = "http://127.0.0.1:3300";
async function login(page: Page) {
  const r = await page.request.post("/api/auth/login", {
    headers: { Origin: origin },
    data: { username: "testa", password: "Test-password-12345" },
  });
  expect(r.status()).toBe(200);
}
const seongsu = { south: 37.54, west: 127.04, north: 37.55, east: 127.06 },
  gangnam = { south: 37.49, west: 127.02, north: 37.51, east: 127.04 };
test("API only returns results inside requested rectangle and rejects missing bounds", async ({
  page,
}) => {
  await login(page);
  expect((await page.request.get("/api/places/search?q=맛집")).status()).toBe(
    400,
  );
  for (const [area, ids] of [
    [seongsu, ["mock-seongsu-cutlet", "mock-seongsu-pasta"]],
    [gangnam, ["mock-gangnam-noodle"]],
  ] as const) {
    const r = await page.request.get(
      `/api/places/search?${new URLSearchParams({ q: "맛집", bounds: JSON.stringify(area) })}`,
    );
    expect(r.status()).toBe(200);
    expect((await r.json()).map((p: { placeId: string }) => p.placeId)).toEqual(
      ids,
    );
  }
});
test("search pins, hover focus and explicit search-here preserve camera with no outer scroll", async ({
  page,
}, info) => {
  await login(page);
  const queries: URL[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/places/search?")) queries.push(new URL(r.url()));
  });
  await page.goto("/map");
  await page
    .getByRole("button", { name: "모의 지도 성수로 이동", exact: true })
    .click();
  await page.getByLabel("대표 메뉴로 찾기", { exact: true }).fill("돈카츠");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  const pin = page.getByRole("button", {
      name: "모의 돈카츠 성수점 핀",
      exact: true,
    }),
    row = page
      .locator(".candidate-row")
      .filter({ hasText: "모의 돈카츠 성수점" });
  await expect(pin).toBeVisible();
  expect(queries).toHaveLength(1);
  await row.hover();
  await expect(pin).toHaveAttribute("data-highlighted", "true");
  await expect(pin).toHaveCSS("transform", /1\.2/);
  await page.getByLabel("대표 메뉴로 찾기", { exact: true }).hover();
  await expect(pin).toHaveAttribute("data-highlighted", "false");
  await row.focus();
  await expect(pin).toHaveAttribute("data-highlighted", "true");
  await page.getByLabel("대표 메뉴로 찾기", { exact: true }).focus();
  await expect(pin).toHaveAttribute("data-highlighted", "false");
  await page
    .getByRole("button", { name: "모의 지도 강남으로 이동", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "현 지도에서 검색", exact: true }),
  ).toBeVisible();
  expect(queries).toHaveLength(1);
  await page
    .getByRole("button", { name: "모의 지도 성수로 이동", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "현 지도에서 검색", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "지도 확대", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "현 지도에서 검색", exact: true }),
  ).toBeVisible();
  expect(queries).toHaveLength(1);
  await page
    .getByRole("button", { name: "모의 지도 강남으로 이동", exact: true })
    .click();
  await page
    .getByRole("button", { name: "현 지도에서 검색", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "일치하는 장소가 없어요" }),
  ).toBeVisible();
  expect(queries).toHaveLength(2);
  const area = JSON.parse(queries[1].searchParams.get("bounds")!);
  expect(area.south).toBeLessThan(37.4979);
  expect(area.north).toBeGreaterThan(37.4979);
  expect(area.north).toBeLessThan(37.54);
  await page.getByLabel("대표 메뉴로 찾기", { exact: true }).fill("맛집");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "모의 평양냉면 강남점 핀", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "현 지도에서 검색", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => ({
      vertical: document.documentElement.scrollHeight <= innerHeight + 1,
      horizontal: document.documentElement.scrollWidth <= innerWidth + 1,
    })),
  ).toEqual({ vertical: true, horizontal: true });
  await page.screenshot({
    path: `docs/screenshots/viewport-search-${info.project.name}.png`,
    fullPage: true,
  });
  await page.setViewportSize({ width: 360, height: 640 });
  await expect(page.locator(".map-pane")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollHeight <= innerHeight + 1 &&
        document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});
test("moving during an in-flight search keeps the new-area button after response", async ({
  page,
}) => {
  await login(page);
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/places/search?*", async (route) => {
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
  });
  await page.goto("/map");
  await page
    .getByRole("button", { name: "모의 지도 성수로 이동", exact: true })
    .click();
  await page.getByLabel("대표 메뉴로 찾기", { exact: true }).fill("돈카츠");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await page
    .getByRole("button", { name: "모의 지도 강남으로 이동", exact: true })
    .click();
  release();
  await expect(
    page.getByRole("button", { name: "현 지도에서 검색", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".candidate-row").filter({ hasText: "모의 돈카츠 성수점" }),
  ).toBeVisible();
});
