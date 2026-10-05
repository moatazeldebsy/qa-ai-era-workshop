#!/usr/bin/env node
// npm run ai:score -- <spec file> — how good is an AI-drafted test suite?
//
// Reviewing generated tests by eye misses a lot. This scores a draft the way
// Topics 2 and 3 scored our own tests:
//   1. against the correct shop: every test should pass (a failure is either
//      a hallucinated expectation or a real bug: you decide which)
//   2. against the shop with the planted pricing bug (BUG_MODE=cart): a good
//      suite fails (it would have caught the regression)
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error('usage: npm run ai:score -- <path to a generated .spec.js file>');
  process.exit(2);
}

// Copy the draft next to a minimal config, so it runs in isolation.
const dir = 'test-results/ai-score';
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
fs.copyFileSync(file, path.join(dir, 'draft.spec.js'));
fs.writeFileSync(
  path.join(dir, 'playwright.config.mjs'),
  "export default { testDir: '.', reporter: 'json', use: { baseURL: process.env.BASE_URL }, outputDir: './out' };\n",
);
const bin = path.resolve('node_modules/.bin/playwright');

async function runAgainst(label, env) {
  const port = 3800 + Math.floor(Math.random() * 100);
  const server = spawn(process.execPath, ['app/src/server.js'], { env: { ...process.env, ...env, PORT: String(port), LOG_REQUESTS: 'false' }, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    if (await fetch(`http://127.0.0.1:${port}/health`).then((r) => r.ok).catch(() => false)) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  const res = spawnSync(bin, ['test', '-c', `${dir}/playwright.config.mjs`], {
    env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1", BASE_URL: `http://127.0.0.1:${port}`, PLAYWRIGHT_JSON_OUTPUT_NAME: path.resolve(dir, `${label}.json`) },
    encoding: 'utf8',
  });
  server.kill();
  const report = JSON.parse(fs.readFileSync(`${dir}/${label}.json`, 'utf8'));
  const tests = [];
  const walk = (s, t) => {
    for (const sp of s.specs ?? []) for (const x of sp.tests) tests.push({ title: [...t, sp.title].join(' › '), ok: x.status === 'expected', error: x.results.at(-1)?.error?.message?.replace(/\u001b\[[0-9;]*m/g, '').split('\n')[0] });
    for (const c of s.suites ?? []) walk(c, [...t, c.title]);
  };
  for (const s of report.suites) walk(s, []);
  return { tests, errors: report.errors ?? [], status: res.status };
}

const clean = await runAgainst('clean', {});
if (!clean.tests.length) {
  console.log('✖ The draft has no runnable tests.', clean.errors.map((e) => e.message).join('\n'));
  process.exit(1);
}
const failing = clean.tests.filter((t) => !t.ok);
console.log(`Against the correct shop: ${clean.tests.length - failing.length}/${clean.tests.length} pass`);
for (const t of failing) console.log(`  ✖ ${t.title}\n      ${t.error ?? ''}`);

const buggy = await runAgainst('bug-cart', { BUG_MODE: 'cart' });
const caught = buggy.tests.filter((t) => !t.ok && clean.tests.find((c) => c.title === t.title)?.ok);
console.log(`\nAgainst the planted pricing bug (BUG_MODE=cart): ${caught.length ? `caught by ${caught.length} test(s)` : 'NOT caught'}`);
for (const t of caught) console.log(`  ✔ ${t.title}`);
console.log('\nNext: review the draft with labs/12-ai-in-qa/testgen/review-checklist.md');
process.exit(failing.length || !caught.length ? 1 : 0);
