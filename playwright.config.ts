import { defineConfig } from "@playwright/test";

const ci = process.env.CI === "true";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  forbidOnly: ci,
  retries: 0,
  reporter: ci ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
  },
  webServer: {
    command: "node scripts/e2e-servers.mjs",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !ci,
    timeout: 60_000,
  },
});
