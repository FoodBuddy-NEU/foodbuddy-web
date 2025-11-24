/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require('child_process');
const path = require('path');

let testsPassed = true;

/**
 * Run Jest tests (collect coverage silently)
 */
function runJestTests() {
  return new Promise((resolve) => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🧪 Running Jest Unit/Integration Tests');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Add --coverage flag here to collect coverage data without displaying it
    const jest = spawn('npm', ['run', 'test:jest', '--', '--coverage'], {
      stdio: 'inherit',
      shell: true,
    });

    jest.on('close', (code) => {
      if (code !== 0) {
        testsPassed = false;
      }
      resolve(code === 0);
    });
  });
}

/**
 * Generate and display unified coverage report
 */
function displayCoverageReport() {
  const { spawnSync } = require('child_process');

  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('📊 GENERATING UNIFIED COVERAGE REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Run the coverage calculation script
  const result = spawnSync('node', [path.join(__dirname, 'calculate-coverage.js')], {
    stdio: 'inherit',
    shell: true,
  });

  if (result.error) {
    console.error('⚠️  Error generating coverage report:', result.error);
  }
}
function runPlaywrightTests() {
  return new Promise((resolve) => {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎭 Running Playwright E2E Tests');
    console.log('(Dev server auto-started by Playwright)\n');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Run all browsers by default (chromium, firefox, webkit, mobile)
    // Use --single-browser flag to run only Chromium for faster feedback
    const args = process.argv.includes('--single-browser')
      ? ['run', 'test:e2e:single']
      : ['run', 'test:e2e'];

    const playwright = spawn('npm', args, {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, CI: 'false' },
    });

    playwright.on('close', (code) => {
      if (code !== 0) {
        testsPassed = false;
      }
      resolve(code === 0);
    });
  });
}

/**
 * Main test runner
 */
async function main() {
  try {
    console.log('\n\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║          🚀 UNIFIED TEST RUNNER - Jest + E2E             ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // Step 1: Run Jest tests
    const jestPassed = await runJestTests();
    console.log('\n✅ Jest tests completed\n');

    // Step 2: Run Playwright tests (which auto-starts dev server)
    const pwPassed = await runPlaywrightTests();
    console.log('\n✅ Playwright tests completed\n');

    // Step 3: Display coverage report
    displayCoverageReport();

    // Step 4: Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Jest Tests:       ${jestPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Playwright Tests: ${pwPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('💡 Tips:');
    console.log('   • Use: npm run test           (Jest + E2E + Coverage Report)');
    console.log('   • Use: npm run test:jest      (Jest only with coverage)');
    console.log('   • Use: npm run test:e2e       (E2E with all browsers)');
    console.log('   • Use: npm run test:watch     (Jest watch mode)');
    console.log('   • Use: npm run test:e2e:ui    (E2E UI mode for debugging)');
    console.log('');

    // Exit with appropriate code
    process.exit(testsPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  }
}

// Handle signals for graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test runner interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Test runner terminated');
  process.exit(1);
});

// Run main
main();
