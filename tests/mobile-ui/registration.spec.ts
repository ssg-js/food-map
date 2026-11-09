import { expect, test } from "@playwright/test";
test("native registration components complete the existing API flow", async ({
  page,
}, testInfo) => {
  const saves: unknown[] = [];
  const cats = [
    { id: "korean", name: "한식" },
    { id: "solo", name: "혼밥" },
  ];
  await page.route("**/api/places/search?*", (route) =>
    route.fulfill({
      json: [
        {
          placeId: "p",
          name: "소담국수 성수점",
          address: "서울 성동구 연무장길 18",
        },
      ],
    }),
  );
  await page.route("**/api/categories", (route) =>
    route.fulfill({ json: { items: cats } }),
  );
  await page.route("**/api/restaurants", (route) => {
    saves.push(route.request().postDataJSON());
    return route.fulfill({
      json: { id: "r", googlePlaceId: "p", categories: [cats[0]] },
    });
  });
  await page.goto("/");
  await expect(page.getByText("맛집 등록", { exact: true })).toBeVisible();
  await page
    .getByRole("textbox", { name: "장소 검색", exact: true })
    .fill("성수 국수");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await page.getByRole("button", { name: /소담국수 성수점/ }).click();
  await page.getByRole("checkbox", { name: "한식", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "한식", exact: true }),
  ).toBeChecked();
  await page.screenshot({
    path: testInfo.outputPath("native-main.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "맛집으로 저장", exact: true })
    .click();
  await expect(
    page.getByText("✓ 맛집으로 저장했어요", { exact: true }),
  ).toBeVisible();
  expect(saves).toEqual([{ googlePlaceId: "p", categoryIds: ["korean"] }]);
  await page
    .getByRole("button", { name: "다른 맛집 등록", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "장소 검색", exact: true }),
  ).toHaveValue("");
});
