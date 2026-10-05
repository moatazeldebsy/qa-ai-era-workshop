#!/usr/bin/env node
// npm run qi:report [-- dir] — a quality report from a folder of test runs.
import fs from 'node:fs';
import { loadHistory, summarize } from './analyze.mjs';

const dir = process.argv[2] ?? 'labs/11-quality-intelligence/history';
if (!fs.existsSync(dir)) {
  console.error(`✖ ${dir} not found: npm run qi:collect first`);
  process.exit(1);
}
const history = loadHistory(dir);
const tests = summarize(history);
const pct = (x) => `${(x * 100).toFixed(0)}%`;

console.log(`Quality report: ${tests.length} tests, ${history.length} runs (${dir})\n`);
console.log('Runs:   ' + history.map(({ results }) => (results.some((r) => r.outcome === 'failed') ? '✖' : '✔')).join(' '));

const failing = tests.filter((t) => t.failingNow);
console.log(`\nFailing in the latest run: ${failing.length ? '' : 'none'}`);
for (const t of failing) console.log(`  ✖ ${t.id}`);

const flaky = tests.filter((t) => t.flaky).sort((a, b) => b.failureRate - a.failureRate);
console.log(`\nFlaky tests: ${flaky.length ? '' : 'none detected'}`);
for (const t of flaky) {
  const retried = t.retriedPasses ? `, ${t.retriedPasses} passed only on retry` : '';
  console.log(`  ⚠ ${pct(t.failureRate).padStart(4)} of ${t.runs} runs failed${retried}  ${t.id}`);
}

console.log('\nSlowest tests (mean):');
for (const t of [...tests].sort((a, b) => b.meanSeconds - a.meanSeconds).slice(0, 5)) {
  console.log(`  ${t.meanSeconds.toFixed(2).padStart(6)} s  ${t.id}`);
}
