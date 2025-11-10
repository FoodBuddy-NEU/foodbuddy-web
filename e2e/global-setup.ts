import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * This runs once before all tests to verify environment setup
 */
async function globalSetup(config: FullConfig) {
  console.log('\n🔍 Verifying environment configuration...\n');

  // Check Firebase configuration
  const firebaseVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  const missingVars = firebaseVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    console.log(
      `⚠️  Missing environment variables: ${missingVars.join(', ')}\n` +
        `   Tests will run with fallback values\n`
    );
  } else {
    console.log('✅ Firebase environment variables configured\n');
  }

  // Verify dev server will start
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = context.pages()[0] || (await context.newPage());

  try {
    console.log('🌐 Waiting for dev server to be ready...\n');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('✅ Dev server is ready\n');
  } catch (error) {
    console.log(
      '⚠️  Dev server not yet available (will be started automatically)\n'
    );
  } finally {
    await browser.close();
  }
}

export default globalSetup;
