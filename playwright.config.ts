import { defineConfig, devices } from "@playwright/test";

const PORT = 3043;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `next dev --turbopack --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DRAFT_FIRST_PICK_DELAY_MS: "2000",
      DRAFT_PICK_INTERVAL_MS: "2000",
      DRAFT_SPIN_DURATION_MS: "1200",
      NEXT_PUBLIC_BASE_URL: `http://localhost:${PORT}`,
    },
  },
});
