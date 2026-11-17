import { test, expect } from "@playwright/test";
test("public pages and API errors carry browser security headers without blocking same-origin map frames", async ({
  request,
}) => {
  for (const path of ["/login", "/api/restaurants"]) {
    const response = await request.get(path);
    const h = response.headers();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("SAMEORIGIN");
    expect(h["content-security-policy"]).toContain("frame-ancestors 'self'");
    expect(h["content-security-policy"]).toContain("object-src 'none'");
    expect(h["permissions-policy"]).toContain("geolocation=(self)");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["x-powered-by"]).toBeUndefined();
  }
});

test("PWA offline cache contains only public shell assets after authenticated use", async ({
  page,
  context,
}) => {
  const login = await page.request.post("/api/auth/login", {
    headers: { Origin: "http://127.0.0.1:3300" },
    data: { username: "testa", password: "Test-password-12345" },
  });
  expect(login.status()).toBe(200);
  await page.goto("/map");
  await page.evaluate(() =>
    navigator.serviceWorker.ready.then(() => undefined),
  );
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await page.evaluate(() =>
    fetch("/api/categories", { cache: "no-store" }).then((r) => r.json()),
  );
  await context.setOffline(true);
  try {
    await page.goto("/map?offline=1");
    await expect(
      page.getByRole("heading", { name: "인터넷 연결을 확인해주세요" }),
    ).toBeVisible();
    const paths = await page.evaluate(async () =>
      (
        await Promise.all(
          (await caches.keys()).map(async (key) =>
            (await (await caches.open(key)).keys()).map(
              (r) => new URL(r.url).pathname,
            ),
          ),
        )
      ).flat(),
    );
    expect(paths.length).toBeGreaterThan(0);
    expect(
      paths.every((p) => p === "/offline.html" || p.startsWith("/icons/")),
    ).toBe(true);
  } finally {
    await context.setOffline(false);
  }
});
