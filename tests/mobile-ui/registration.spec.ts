import { expect, test } from "@playwright/test";
test("native registration components complete the existing API flow", async ({
  page,
}, testInfo) => {
  const saves: unknown[] = [];
  const cats = [
    { id: "korean", name: "한식", kind: "FOOD" },
    { id: "solo", name: "혼밥", kind: "PURPOSE" },
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
  await page.route("**/api/restaurants?*", route => route.fulfill({json:null}));
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
  await page.getByRole("checkbox", { name: "한식", kind: "FOOD", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "한식", kind: "FOOD", exact: true }),
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

test("native limit popup is dismissible without losing search text",async({page})=>{
  let calls=0;
  await page.route("**/api/places/search?*",route=>{calls++;return route.fulfill({status:429,json:{code:"SEARCH_LIMIT_REACHED",message:"오늘의 검색 한도에 도달했어요."}});});
  await page.goto("/");await page.getByRole("textbox",{name:"장소 검색",exact:true}).fill("성수");
  await page.getByRole("button",{name:"검색",exact:true}).click();
  await expect(page.getByText("검색을 잠시 중단했어요",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"확인",exact:true}).click();
  await expect(page.getByText("검색을 잠시 중단했어요",{exact:true})).not.toBeVisible();
  await expect(page.getByRole("textbox",{name:"장소 검색",exact:true})).toHaveValue("성수");expect(calls).toBe(1);
});
