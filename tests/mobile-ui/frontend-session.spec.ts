import { test, expect } from "@playwright/test";
test("Expo hides the previous account screen when foreground verification changes owner", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "아이디", exact: true })
    .fill("testa");
  await page
    .getByLabel("비밀번호", { exact: true })
    .fill("Test-password-12345");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "대표 메뉴로 찾기", exact: true }),
  ).toBeVisible();
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({
      json: { user: { id: "testb", username: "testb", role: "USER" } },
    }),
  );
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("button", { name: "로그인", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "대표 메뉴로 찾기", exact: true }),
  ).toHaveCount(0);
});
test("saved map keeps a fixed private URL while selecting places and returning to GPS", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 37.5455, longitude: 127.0543 });
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "아이디", exact: true })
    .fill("testa");
  await page
    .getByLabel("비밀번호", { exact: true })
    .fill("Test-password-12345");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "대표 메뉴로 찾기", exact: true }),
  ).toBeVisible();
  const categoriesResponse = await page.request.get("/api/categories");
  expect(categoriesResponse.status()).toBe(200);
  const categories = await categoriesResponse.json();
  let categoryId = categories.items.find(
    (c: { kind: string }) => c.kind !== "UNCLASSIFIED",
  )?.id;
  if (!categoryId) {
    const response = await page.request.post("/api/categories", {
      headers: { Origin: "http://127.0.0.1:3200" },
      data: { name: "지도 검증 분류", kind: "DISH" },
    });
    expect(response.ok()).toBe(true);
    categoryId = (await response.json()).id;
  }
  expect(categoryId).toBeTruthy();
  for (const googlePlaceId of ["mock-seongsu-cutlet", "mock-seongsu-pasta"]) {
    const existing = await (
      await page.request.get(`/api/restaurants?placeId=${googlePlaceId}`)
    ).json();
    const response = await page.request.post("/api/restaurants", {
      headers: { Origin: "http://127.0.0.1:3200" },
      data: {
        googlePlaceId,
        categoryIds: [categoryId],
        ...(existing?.updatedAt
          ? { expectedUpdatedAt: existing.updatedAt }
          : {}),
      },
    });
    expect(response.ok()).toBe(true);
  }
  await page.goto("/saved");
  const frame = page.frameLocator("iframe");
  await expect(page.locator("iframe")).toHaveAttribute(
    "src",
    "http://127.0.0.1:3200/map-search",
  );
  await expect(
    frame.getByRole("region", { name: /지도$/ }).first(),
  ).toBeVisible();
  let navigations = 0;
  page.on("framenavigated", (f) => {
    if (f !== page.mainFrame()) navigations++;
  });
  await page
    .getByRole("button", { name: /^\d+\. 모의 파스타 성수점$/ })
    .click();
  await expect(
    frame.getByRole("region", { name: "모의 파스타 성수점 지도", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "현재 위치 표시", exact: true })
    .click();
  await expect(frame.getByTestId("current-location-marker")).toBeVisible();
  await expect(
    frame.getByRole("button", { name: "모의 파스타 성수점 핀", exact: true }),
  ).toBeVisible();
  expect(navigations).toBe(0);
  expect(
    new URL((await page.locator("iframe").getAttribute("src")) ?? "").search,
  ).toBe("");
});
