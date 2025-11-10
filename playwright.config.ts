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
  globalSetup: require.resolve('./e2e/global-setup.ts'),

  /* Increase timeout for slow CI environments */
  timeout: 60 * 1000, // 60 seconds per test

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

    /* Increase action timeout for slow network */
    actionTimeout: 15 * 1000, // 15 seconds

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
    timeout: 60 * 1000, // 60 seconds timeout for environment setup
    ignoreHTTPSErrors: true,
    env: {
      // Ensure Firebase and API keys are available during E2E tests
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'test-key',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'test.firebaseapp.com',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'test-project',
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'test-app-id',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'test.appspot.com',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'test-sender-id',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'test-maps-key',
    },
  },
});
