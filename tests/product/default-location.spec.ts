import { test, expect } from "@playwright/test";
async function login(page: import("@playwright/test").Page) {
  const r = await page.request.post("/api/auth/login", {
    headers: { Origin: "http://127.0.0.1:3300" },
    data: { username: "testa", password: "Test-password-12345" },
  });
  expect(r.ok()).toBe(true);
}
test("map automatically centers on granted user location", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({
    latitude: 35.1796,
    longitude: 129.0756,
    accuracy: 20,
  });
  await login(page);
  await page.goto("/map");
  const map = page.getByRole("region", { name: "현재 위치 지도", exact: true });
  await expect(map).toHaveAttribute("data-latitude", "35.1796");
  await expect(map).toHaveAttribute("data-longitude", "129.0756");
  await expect(
    page.getByText("현재 위치를 표시했어요. 오차 약 20m"),
  ).toBeVisible();
});
test("permission denial keeps fallback map and retry available", async ({
  page,
}) => {
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (_ok, fail) => {
      fail?.({
        code: 1,
        message: "denied",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
    };
  });
  await login(page);
  await page.goto("/map");
  await expect(
    page.getByRole("region", {
      name: "기본 지도 · 서울시청 지도",
      exact: true,
    }),
  ).toHaveAttribute("data-latitude", "37.5665");
  await expect(
    page.getByText(/위치 권한이 꺼져 있어 기본 지도를 표시해요/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "현재 위치 표시", exact: true }),
  ).toBeEnabled();
});
test("late automatic location response cannot replace selected restaurant", async ({
  page,
}) => {
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (ok) => {
      Object.assign(window, {
        deliverLocation: () =>
          ok({
            coords: {
              latitude: 35.1796,
              longitude: 129.0756,
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
              toJSON: () => ({}),
            },
            timestamp: Date.now(),
            toJSON: () => ({}),
          }),
      });
    };
  });
  await login(page);
  await page.goto("/map");
  await page
    .getByRole("button", { name: "모의 지도 성수로 이동", exact: true })
    .click();
  await page.getByLabel("대표 메뉴로 찾기", { exact: true }).fill("돈카츠");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await page
    .locator(".candidate-row")
    .filter({ hasText: "모의 돈카츠 성수점" })
    .click();
  await expect(
    page.getByRole("region", { name: "모의 돈카츠 성수점 지도", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    (window as unknown as { deliverLocation: () => void }).deliverLocation();
  });
  await expect(
    page.getByRole("button", { name: "모의 돈카츠 성수점 핀", exact: true }),
  ).toHaveAttribute("data-latitude", "37.5445");
});
