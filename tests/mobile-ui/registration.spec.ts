import { test, expect } from "@playwright/test";
test("Expo UI authenticates and saves through real personal API", async ({
  page,
}, info) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (/googleapis|gstatic/.test(r.url())) external.push(r.url());
  });
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "아이디", exact: true })
    .fill("testa");
  await page
    .getByLabel("비밀번호", { exact: true })
    .fill("Test-password-12345");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(
    page.getByText("맛집 등록", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "대표 메뉴로 찾기", exact: true })
    .fill("돈카츠");
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await page.getByRole("button", { name: /모의 돈카츠 성수점/ }).click();
  const name = `메뉴${Date.now()}`;
  await page.getByRole("button", { name: "대표 메뉴 직접 추가" }).click();
  await page
    .getByRole("textbox", { name: "새 대표 메뉴", exact: true })
    .fill(name);
  await page.getByRole("button", { name: "추가", exact: true }).click();
  await page
    .getByRole("button", { name: "맛집으로 저장", exact: true })
    .click();
  await expect(
    page.getByText("✓ 맛집으로 저장했어요", { exact: true }),
  ).toBeVisible();
  expect(external).toEqual([]);
  await page.screenshot({
    path: `docs/screenshots/personal-expo-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "아이디", exact: true }),
  ).toBeVisible();
});
