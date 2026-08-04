import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:4319",
  },
  webServer: {
    command: "node scripts/serve-out.mjs 4319",
    url: "http://localhost:4319",
    reuseExistingServer: true,
  },
});
