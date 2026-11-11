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
  await page.route("**/api/restaurants?*", (route) =>
    route.fulfill({ json: null }),
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
  await page
    .getByRole("checkbox", { name: "한식", kind: "FOOD", exact: true })
    .click();
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

test("native limit popup is dismissible without losing search text", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/places/search?*", (route) => {
    calls++;
    return route.fulfill({
      status: 429,
      json: {
        code: "SEARCH_LIMIT_REACHED",
        message: "오늘의 검색 한도에 도달했어요.",
      },
    });
  });
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "장소 검색", exact: true })
    .fill("성수");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(
    page.getByText("검색을 잠시 중단했어요", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "확인", exact: true }).click();
  await expect(
    page.getByText("검색을 잠시 중단했어요", { exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "장소 검색", exact: true }),
  ).toHaveValue("성수");
  expect(calls).toBe(1);
});

test("native saved list filters and in-app selected marker", async ({
  page,
}, testInfo) => {
  const category = {
    id: "food",
    name: "파스타",
    kind: "FOOD",
    updatedAt: "2026-11-12T00:00:00.000Z",
    _count: { restaurants: 1 },
  };
  await page.route("**/api/categories", (r) =>
    r.fulfill({ json: { items: [category] } }),
  );
  await page.route("**/api/restaurants?*", (r) =>
    r.fulfill({
      json: {
        items: [
          {
            id: "r",
            googlePlaceId: "p",
            updatedAt: "2026-11-12T00:00:00.000Z",
            categories: [category],
          },
        ],
        total: 1,
        page: 1,
        pageSize: 12,
      },
    }),
  );
  await page.route("**/api/places/p", (r) =>
    r.fulfill({
      json: {
        placeId: "p",
        name: "앱 테스트 파스타",
        address: "서울",
        location: { latitude: 37.5, longitude: 127.0 },
      },
    }),
  );
  await page.route("**/map-preview?*", (r) =>
    r.fulfill({
      body: "<html>selected marker</html>",
      contentType: "text/html",
    }),
  );
  await page.goto("/saved");
  await expect(
    page.getByText("앱 테스트 파스타", { exact: true }),
  ).toBeVisible();
  await page.getByRole("checkbox", { name: "파스타", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "파스타", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
  await page
    .getByRole("button", { name: "지도에서 보기", exact: true })
    .click();
  await expect(page.getByTitle("앱 테스트 파스타 위치")).toHaveAttribute(
    "src",
    /lat=37.5&lng=127/,
  );
  await page.screenshot({
    path: `docs/screenshots/native-saved-${testInfo.project.name}.png`,
    fullPage: true,
  });
});
test("native category manager edits classification after operator login", async ({
  page,
}) => {
  let category = {
    id: "c",
    name: "초기 분류",
    kind: "UNCLASSIFIED",
    updatedAt: "2026-11-12T00:00:00.000Z",
    _count: { restaurants: 2 },
  };
  await page.route("**/api/categories", (r) =>
    r.fulfill({ json: { items: [category] } }),
  );
  await page.route("**/api/admin/session", (r) =>
    r.fulfill({ json: { ok: true, token: "test-session" } }),
  );
  await page.route("**/api/categories/c", async (r) => {
    const data = r.request().postDataJSON();
    category = { ...category, name: data.name, kind: data.kind };
    await r.fulfill({ json: category });
  });
  await page.goto("/categories");
  await page
    .getByRole("button", { name: "수정·삭제 권한 확인", exact: true })
    .click();
  await page.getByLabel("관리자 접근 키", { exact: true }).fill("test-key");
  await page.getByRole("button", { name: "권한 확인", exact: true }).click();
  await page
    .getByRole("button", { name: "이름·분류 수정", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "카테고리 이름", exact: true })
    .fill("데이트");
  await page.getByRole("checkbox", { name: "방문 목적", exact: true }).click();
  await page.getByRole("button", { name: "변경 저장", exact: true }).click();
  await expect(page.getByText("데이트", { exact: true })).toBeVisible();
  expect(category.kind).toBe("PURPOSE");
});
