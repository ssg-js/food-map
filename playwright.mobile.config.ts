import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/mobile-ui",
  outputDir: "test-results/mobile-ui",
  workers: 1,
  retries: 0,
  timeout: 30000,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3200",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "native-phone", use: { ...devices["Pixel 7"] } },
    {
      name: "native-tablet",
      use: { ...devices["iPad Mini"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: [
    {
      command: "node scripts/product-test-server.mjs",
      url: "http://127.0.0.1:3300/login",
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: "node scripts/mobile-qa-server.mjs",
      url: "http://127.0.0.1:3200",
      reuseExistingServer: false,
    },
  ],
});
