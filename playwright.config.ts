import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for FoodBuddy
 *
 * This configuration enables E2E testing to achieve 70%+ code coverage
 * when combined with Jest unit tests.
 *
 * Usage:
 * - npm run test:e2e              # Run E2E tests
 * - npm run test:e2e -- --headed  # Run with browser visible
 * - npm run test:e2e -- --debug   # Debug mode
 */
export default defineConfig({
  testDir: './e2e',

  /* Run tests in parallel for faster execution */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: process.env.CI === 'true',

  /* Retry on CI only */
  retries: process.env.CI === 'true' ? 2 : 0 /* Number of workers: 10 for optimal performance */,
  workers: 10,

  /* Reporter configuration */
  reporter: 'html',

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: process.env.CI !== 'true',
    timeout: 20 * 1000, // 20 seconds timeout
    ignoreHTTPSErrors: true,
  },
});
