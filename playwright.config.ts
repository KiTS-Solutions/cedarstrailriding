import { defineConfig, devices } from "@playwright/test";

// Deliberately not Astro's 4321: with reuseExistingServer, a running `astro dev` there would be
// tested instead of dist/ (dev toolbar and all). Override with `PORT=… npm run test:e2e`.
const PORT = Number(process.env.PORT ?? 4399);

export default defineConfig({
  testDir: "./tests",
  testIgnore: "unit/**",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: `http://localhost:${PORT}`,
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
    command: `npm run build && PORT=${PORT} node scripts/static-server.mjs`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
