import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    // `astro preview` detaches into a managed background process in this Astro
    // version, which doesn't fit Playwright's foreground-process contract — see
    // scripts/static-server.mjs for why we serve the build output ourselves instead.
    command: "npm run build && node scripts/static-server.mjs",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
