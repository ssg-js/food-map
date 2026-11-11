import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/product",
  outputDir: "test-results/product",
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 40000,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3300",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command: "node scripts/product-test-server.mjs",
    url: "http://127.0.0.1:3300/map",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
