import { test, expect } from "@playwright/test";
const origin = "http://127.0.0.1:3300";
async function login(page: import("@playwright/test").Page) {
  const response = await page.request.post("/api/auth/login", {
    headers: { Origin: origin },
    data: { username: "testa", password: "Test-password-12345" },
  });
  expect(response.status()).toBe(200);
}
test("public service policies remain readable before login", async ({
  page,
}, info) => {
  for (const [path, title] of [
    ["/terms", "서비스 이용 안내"],
    ["/privacy", "데이터 처리 안내"],
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: title, exact: true }),
    ).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(
      page.getByRole("heading", { name: "배포 전 확정할 운영 정보" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  }
  await expect(
    page.getByRole("link", { name: "Google 개인정보처리방침", exact: true }),
  ).toHaveAttribute("href", "https://policies.google.com/privacy");
  await page.screenshot({
    path: `docs/screenshots/service-policy-${info.project.name}.png`,
    fullPage: true,
  });
});
test("successful logout still redirects when localStorage is blocked", async ({
  page,
}) => {
  await login(page);
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    }),
  );
  await page.goto("/map");
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "다시 만나 반가워요" }),
  ).toBeVisible();
});
test("map frames require authentication and accept native bearer without URL credentials", async ({
  request,
}) => {
  for (const path of ["/map-search", "/map-preview?lat=37.5&lng=127"]) {
    const anonymous = await request.get(path, { maxRedirects: 0 });
    expect(anonymous.status()).toBe(307);
    expect(anonymous.headers().location).toBe("/login");
  }
  const login = await request.post("/api/auth/login", {
    headers: { "x-food-map-client": "native" },
    data: { username: "testa", password: "Test-password-12345" },
  });
  expect(login.status()).toBe(200);
  const body = await login.json();
  expect(typeof body.token).toBe("string");
  for (const path of ["/map-search", "/map-preview?lat=37.5&lng=127"]) {
    const response = await request.get(path, {
      headers: { Authorization: `Bearer ${body.token}`, Cookie: "" },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(200);
    expect((await response.text()).includes(body.token)).toBe(false);
  }
});
test("search candidates display provider attribution with safe links", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 37.5455, longitude: 127.0543 });
  await login(page);
  await page.route("**/api/places/search?*", (route) =>
    route.fulfill({
      json: [
        {
          placeId: "mock-seongsu-cutlet",
          name: "귀속 표시 맛집",
          address: "테스트 주소",
          location: { latitude: 37.5455, longitude: 127.0543 },
          attributions: [
            {
              provider: "테스트 장소 제공자",
              providerUri: "https://example.com/provider",
            },
            {
              provider: "안전하지 않은 링크 제공자",
              providerUri: "javascript:alert(1)",
            },
          ],
        },
      ],
    }),
  );
  await page.goto("/map");
  await page.getByLabel("대표 메뉴로 찾기", { exact: true }).fill("맛집");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "테스트 장소 제공자", exact: true }),
  ).toHaveAttribute("href", "https://example.com/provider");
  await expect(
    page.getByText("안전하지 않은 링크 제공자", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "안전하지 않은 링크 제공자", exact: true }),
  ).toHaveCount(0);
});
