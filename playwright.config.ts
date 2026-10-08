import { defineConfig, devices } from "@playwright/test";

// PORT picks another port when 4317 is taken (serve-e2e.mjs reads the same variable).
const port = Number(process.env.PORT ?? 4317);

export default defineConfig({
  testDir: "test/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "node scripts/serve-e2e.mjs",
    url: `http://localhost:${port}/test/e2e/fixtures/index.html`,
    reuseExistingServer: !process.env.CI,
  },
});
