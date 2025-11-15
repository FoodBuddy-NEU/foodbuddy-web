import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

async function globalSetup() {
  console.log('\n🔍 Verifying environment configuration...\n');

  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const parsed = dotenv.parse(fs.readFileSync(envLocalPath));
    for (const [key, value] of Object.entries(parsed)) {
      if (!process.env[key]) process.env[key] = value;
    }
    console.log('✅ Loaded .env.local for Playwright environment\n');
  }

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
  } catch {
    console.log(
      '⚠️  Dev server not yet available (will be started automatically)\n'
    );
  } finally {
    await browser.close();
  }
}

export default globalSetup;
