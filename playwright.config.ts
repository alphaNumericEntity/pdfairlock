import { defineConfig, devices } from "@playwright/test";

const liveBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  retries: 0,
  use: {
    baseURL: liveBaseUrl ?? "http://localhost:4319",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: liveBaseUrl
    ? undefined
    : {
        command: "node scripts/serve-out.mjs 4319",
        url: "http://localhost:4319",
        reuseExistingServer: true,
      },
});
