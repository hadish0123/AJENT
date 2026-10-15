import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run start",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      HADI_STUDIO_AUTH_REQUIRED: "true",
      HADI_STUDIO_OWNER: process.env.HADI_STUDIO_OWNER || "hadi",
      HADI_STUDIO_PASSWORD: process.env.HADI_STUDIO_PASSWORD || "ci-owner-password",
      HADI_AUTH_SECRET:
        process.env.HADI_AUTH_SECRET ||
        "ci-auth-secret-0123456789-abcdefghijklmnopqrstuvwxyz",
    },
  },
});
