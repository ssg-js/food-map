import { expect, test, type Page } from "@playwright/test";
const places = [
  {
    placeId: "place-a",
    name: "소담국수 성수점",
    address: "서울 성동구 연무장길 18",
  },
  { placeId: "place-b", name: "성수 온면", address: "서울 성동구 성수이로 24" },
  { placeId: "place-c", name: "정담국수", address: "서울 성동구 뚝섬로 32" },
];
async function mockApi(page: Page) {
  const categories = [
    { id: "korean", name: "한식", kind: "FOOD" },
    { id: "solo", name: "혼밥", kind: "PURPOSE" },
    { id: "cafe", name: "카페", kind: "FOOD" },
  ];
  const saves: unknown[] = [];
  await page.route("**/api/places/search?*", (route) =>
    route.fulfill({ json: places }),
  );
  await page.route("**/api/categories", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      const category = { id: "new", name: body.name, kind: body.kind };
      categories.push(category);
      await route.fulfill({ status: 201, json: category });
    } else await route.fulfill({ json: { items: categories } });
  });
  await page.route("**/api/restaurants?*", route => route.fulfill({json:null}));
  await page.route("**/api/restaurants", async (route) => {
    const body = route.request().postDataJSON();
    saves.push(body);
    await route.fulfill({
      json: {
        id: "r",
        googlePlaceId: body.googlePlaceId,
        categories: categories.filter((c) => body.categoryIds.includes(c.id)),
      },
    });
  });
  return { saves };
}
async function searchAndSelect(page: Page) {
  await page
    .getByRole("searchbox", { name: "장소 검색", exact: true })
    .fill("성수 국수");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await page.getByRole("button", { name: /소담국수 성수점/ }).click();
  await expect(
    page.getByRole("button", { name: "한식", kind: "FOOD", exact: true }),
  ).toBeVisible();
}
test("MVP registration, category creation and reset", async ({
  page,
}, testInfo) => {
  const { saves } = await mockApi(page);
  await page.goto("/");
  await expect(page).toHaveURL(/\/map$/);
  await expect(
    page.getByRole("heading", { name: "맛집 등록", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "검색", exact: true }),
  ).toBeDisabled();
  await searchAndSelect(page);
  await page.getByRole("button", { name: "한식", kind: "FOOD", exact: true }).click();
  await page.getByRole("button", { name: "혼밥", kind: "PURPOSE", exact: true }).click();
  await page.getByRole("button", {name:"방문 목적 직접 추가"}).click();
  await page
    .getByRole("textbox", { name: "새 방문 목적", exact: true })
    .fill("점심 모임");
  await page.getByRole("button", { name: "추가", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "점심 모임", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({
    path: testInfo.outputPath("main-selected.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "맛집으로 저장", exact: true })
    .click();
  await expect(
    page.getByText("맛집으로 저장했어요", { exact: true }),
  ).toBeVisible();
  expect(saves).toEqual([
    { googlePlaceId: "place-a", categoryIds: ["korean", "solo", "new"] },
  ]);
  await page
    .getByRole("button", { name: "다른 맛집 등록", exact: true })
    .click();
  await expect(
    page.getByRole("searchbox", { name: "장소 검색", exact: true }),
  ).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "맛집으로 저장", exact: true }),
  ).toHaveCount(0);
});
test("new place resets categories; zero categories remains valid", async ({
  page,
}) => {
  const { saves } = await mockApi(page);
  await page.goto("/map");
  await searchAndSelect(page);
  await page.getByRole("button", { name: "한식", kind: "FOOD", exact: true }).click();
  await page.getByRole("button", { name: /성수 온면/ }).click();
  await expect(
    page.getByRole("button", { name: "한식", kind: "FOOD", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page
    .getByRole("button", { name: "맛집으로 저장", exact: true })
    .click();
  await expect(
    page.getByText("맛집으로 저장했어요", { exact: true }),
  ).toBeVisible();
  expect(saves).toEqual([{ googlePlaceId: "place-b", categoryIds: [] }]);
});
test("search errors can retry and empty results clear selection", async ({
  page,
}) => {
  await mockApi(page);
  let calls = 0;
  await page.route("**/api/places/search?*", (route) => {
    calls++;
    return calls === 1
      ? route.fulfill({
          status: 503,
          json: { message: "검색을 잠시 이용할 수 없어요." },
        })
      : route.fulfill({ json: [] });
  });
  await page.goto("/map");
  await page.getByRole("searchbox").fill("없는 맛집");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "맛집 등록", exact: true })
      .getByRole("alert"),
  ).toContainText("검색을 잠시 이용할 수 없어요.");
  expect(calls).toBe(1);
  await page.getByRole("button", { name: "다시 시도", exact: true }).click();
  await expect(
    page.getByText("일치하는 장소가 없어요", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "맛집으로 저장", exact: true }),
  ).toHaveCount(0);
});
test("no automatic searches and no horizontal overflow", async ({ page }) => {
  let calls = 0;
  await mockApi(page);
  await page.route("**/api/places/search?*", (route) => {
    calls++;
    return route.fulfill({ json: places });
  });
  await page.goto("/map");
  await page.getByRole("searchbox").fill("성수");
  await page.waitForTimeout(600);
  expect(calls).toBe(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "앱으로 사용" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "확인", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("save errors recover without losing selection", async ({ page }) => {
  await mockApi(page);
  let attempts = 0;
  await page.route("**/api/restaurants?*", route => route.fulfill({json:null}));
  await page.route("**/api/restaurants", (route) => {
    attempts++;
    return attempts === 1
      ? route.fulfill({ status: 500, json: { message: "저장하지 못했어요." } })
      : route.fulfill({
          json: { id: "r", googlePlaceId: "place-a", categories: [] },
        });
  });
  await page.goto("/map");
  await searchAndSelect(page);
  await page
    .getByRole("button", { name: "맛집으로 저장", exact: true })
    .click();
  await expect(
    page
      .getByRole("region", { name: "맛집 등록", exact: true })
      .getByRole("alert"),
  ).toContainText("저장하지 못했어요.");
  await page
    .getByRole("button", { name: "맛집으로 저장", exact: true })
    .click();
  await expect(
    page.getByText("맛집으로 저장했어요", { exact: true }),
  ).toBeVisible();
});
test("PWA manifest and offline fallback do not cache APIs", async ({
  page,
  context,
  request,
}) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  expect((await manifest.json()).display).toBe("standalone");
  await mockApi(page);
  await page.goto("/map");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  await context.setOffline(true);
  await page.goto("/map?offline=1");
  await expect(
    page.getByRole("heading", { name: "인터넷 연결을 확인해주세요" }),
  ).toBeVisible();
  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    return (
      await Promise.all(
        keys.map(async (key) =>
          (await (await caches.open(key)).keys()).map((r) => r.url),
        ),
      )
    ).flat();
  });
  expect(
    cached.every((url) => !url.includes("/api/") && !url.includes("google")),
  ).toBe(true);
  await context.setOffline(false);
});

for (const code of ["SEARCH_LIMIT_REACHED", "SEARCH_BUDGET_UNCONFIGURED", "SEARCH_BUDGET_UNAVAILABLE", "SEARCH_PROVIDER_LIMIT"]) {
  test(`blocked search shows dismissible popup: ${code}`,async ({page})=>{
    await mockApi(page);
    let calls=0;
    await page.route("**/api/places/search?*",route=>{calls++;return route.fulfill({status:429,json:{code,message:"추가 비용을 막기 위해 검색을 중단했어요."}});});
    await page.goto("/map");await page.getByRole("searchbox").fill("성수");await page.getByRole("button",{name:"검색",exact:true}).click();
    const dialog=page.getByRole("dialog",{name:"검색을 잠시 중단했어요"});await expect(dialog).toBeVisible();
    await dialog.getByRole("button",{name:"확인",exact:true}).click();await expect(dialog).not.toBeVisible();
    await expect(page.getByRole("searchbox")).toHaveValue("성수");expect(calls).toBe(1);
  });
}
test("saved place retains previous categories when editing",async({page})=>{
  const {saves}=await mockApi(page);
  await page.route("**/api/restaurants?*",route=>route.fulfill({json:{id:"r",googlePlaceId:"place-a",categories:[{id:"solo",name:"혼밥",kind:"PURPOSE"}]}}));
  await page.goto("/map");await searchAndSelect(page);
  await expect(page.getByRole("button",{name:"혼밥",exact:true})).toHaveAttribute("aria-pressed","true");
  await page.getByRole("button",{name:"한식",exact:true}).click();await page.getByRole("button",{name:"맛집으로 저장",exact:true}).click();
  await expect(page.getByText("맛집으로 저장했어요",{exact:true})).toBeVisible();
  expect(saves).toEqual([{googlePlaceId:"place-a",categoryIds:["solo","korean"]}]);
});
