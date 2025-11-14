/* eslint-disable @typescript-eslint/no-require-imports, @next/next/no-assign-module-variable */
const fs = require('fs');
const path = require('path');

function readJestCoverageSummary() {
  const summaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
  if (!fs.existsSync(summaryPath)) {
    console.error('⚠️  Jest coverage summary not found at coverage/coverage-summary.json');
    console.error('   Run Jest with coverage enabled: npm run test:coverage');
    process.exit(1);
  }
  const json = fs.readFileSync(summaryPath, 'utf8');
  return JSON.parse(json);
}

function formatBar(pct) {
  const width = 20;
  const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
  const filled = Math.round((clamped / 100) * width);
  return '[' + '█'.repeat(filled) + '░'.repeat(width - filled) + ']';
}

function printCoverageSummary() {
  const summary = readJestCoverageSummary();
  const total = summary.total || {};

  const lines = Number(total.lines?.pct ?? 0);
  const statements = Number(total.statements?.pct ?? 0);
  const branches = Number(total.branches?.pct ?? 0);
  const functions = Number(total.functions?.pct ?? 0);

  // Average the four metrics for a single Jest Coverage score
  const avg = Math.round(((lines + statements + branches + functions) / 4) * 100) / 100;

  const target = 70; // target coverage threshold (percent)
  const meetsTarget = avg >= target;

  console.log('\nCOVERAGE (Jest only):');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   Lines:       ${String(lines).padStart(5)}%  ${formatBar(lines)}`);
  console.log(`   Statements:  ${String(statements).padStart(5)}%  ${formatBar(statements)}`);
  console.log(`   Branches:    ${String(branches).padStart(5)}%  ${formatBar(branches)}`);
  console.log(`   Functions:   ${String(functions).padStart(5)}%  ${formatBar(functions)}`);
  console.log('   ────────────────────────────────────────────────────────');
  console.log(`   Jest Coverage: ${String(avg).padStart(5)}%  ${formatBar(avg)}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📊 Coverage Target:  ${target}%`);
  console.log(`📊 Current:          ${avg}%`);
  console.log(`📊 Status:           ${meetsTarget ? '✅ Target Met' : '❌ Below Target'}\n`);
}

// Entrypoint — use Jest’s instrumented coverage only
printCoverageSummary();