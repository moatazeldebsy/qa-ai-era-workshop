#!/usr/bin/env node
// Lab 7 - a release quality gate.
//
// Reads whatever evidence the earlier steps produced in test-results/ and
// turns it into ONE decision - ship or don't - with the reasons:
//
//   test-results/junit.xml        Playwright (Labs 1, 2)
//   test-results/llm-eval.json    promptfoo  (Lab 6)
//   test-results/k6-summary.json  k6         (Lab 5)
//
// Thresholds live in gate.config.json. A missing input fails the gate only
// when that check is marked "required". Exit code 0 = ship, 1 = blocked.
// In GitHub Actions the verdict is also written to the job summary.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const results = path.resolve(process.env.RESULTS_DIR || 'test-results');
const config = JSON.parse(fs.readFileSync(path.join(here, 'gate.config.json'), 'utf8'));

const checks = [];
const add = (name, status, detail) => checks.push({ name, status, detail });

function readIfExists(file) {
  const p = path.join(results, file);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

// ── Functional tests (JUnit XML from Playwright) ──────────────────────────────
const junit = readIfExists('junit.xml');
if (!junit) {
  add('Functional tests', config.tests.required ? 'fail' : 'skip', 'no test-results/junit.xml - run `npm test` first');
} else {
  const attr = (name) => Number(junit.match(new RegExp(`<testsuites[^>]*\\b${name}="(\\d+)"`))?.[1] ?? 0);
  const total = attr('tests');
  const failed = attr('failures') + attr('errors');
  const skipped = attr('skipped');
  add(
    'Functional tests',
    failed <= config.tests.maxFailed && total > 0 ? 'pass' : 'fail',
    `${total - failed - skipped}/${total} passed, ${failed} failed, ${skipped} skipped (max failed: ${config.tests.maxFailed})`,
  );
}

// ── LLM evaluation (promptfoo JSON) ───────────────────────────────────────────
const evalRaw = readIfExists('llm-eval.json');
if (!evalRaw) {
  add('LLM evaluation', config.llmEval.required ? 'fail' : 'skip', 'no test-results/llm-eval.json - run `npm run eval:llm`');
} else {
  const stats = JSON.parse(evalRaw).results?.stats ?? {};
  const passed = stats.successes ?? 0;
  const total = passed + (stats.failures ?? 0) + (stats.errors ?? 0);
  const rate = total ? passed / total : 0;
  add(
    'LLM evaluation',
    rate >= config.llmEval.minPassRate ? 'pass' : 'fail',
    `${passed}/${total} cases passed (${(rate * 100).toFixed(0)}%, min ${(config.llmEval.minPassRate * 100).toFixed(0)}%)`,
  );
}

// ── Performance (k6 summary) ──────────────────────────────────────────────────
const k6Raw = readIfExists('k6-summary.json');
if (!k6Raw) {
  add('Performance', config.performance.required ? 'fail' : 'skip', 'no test-results/k6-summary.json - run `npm run perf:smoke`');
} else {
  const m = JSON.parse(k6Raw).metrics;
  const problems = [];
  const parts = [];
  for (const [endpoint, limit] of Object.entries(config.performance.maxP95Ms)) {
    const p95 = m[`http_req_duration{endpoint:${endpoint}}`]?.values?.['p(95)'];
    if (p95 === undefined) continue;
    parts.push(`${endpoint} p95 ${p95.toFixed(0)}ms`);
    if (p95 > limit) problems.push(`${endpoint} p95 ${p95.toFixed(0)}ms > ${limit}ms`);
  }
  const errRate = m.http_req_failed?.values?.rate ?? 0;
  parts.push(`errors ${(errRate * 100).toFixed(2)}%`);
  if (errRate > config.performance.maxErrorRate) problems.push(`error rate ${(errRate * 100).toFixed(2)}%`);
  add('Performance', problems.length ? 'fail' : 'pass', problems.length ? problems.join('; ') : parts.join(', '));
}

// ── Verdict ───────────────────────────────────────────────────────────────────
const blocked = checks.some((c) => c.status === 'fail');
const icon = { pass: '✅', fail: '❌', skip: '⏭️' };
const table = [
  `## Quality gate: ${blocked ? '❌ BLOCKED' : '✅ READY TO RELEASE'}`,
  '',
  '| Check | Result | Detail |',
  '|---|---|---|',
  ...checks.map((c) => `| ${c.name} | ${icon[c.status]} ${c.status} | ${c.detail} |`),
  '',
].join('\n');

console.log(table);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, table + '\n');
process.exit(blocked ? 1 : 0);
