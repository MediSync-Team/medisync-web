import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for the Next.js App Router web app.
 *
 * - Spins up the dev server on :3000 (reused locally, fresh in CI).
 * - Captures trace + video only on failure to keep artifacts small.
 * - Runs the suite across desktop and mobile viewports.
 *
 * Run:  npm run test:e2e        (first time: `npx playwright install` for browsers)
 * Env:  E2E_BASE_URL to point at a deployed environment instead of localhost.
 */
const PORT = Number(process.env.E2E_PORT ?? 3000);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],

  // Only manage the dev server when targeting localhost.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: BASE_URL,
        port: PORT,
        reuseExistingServer: !isCI,
        timeout: 120_000,
      },
});
