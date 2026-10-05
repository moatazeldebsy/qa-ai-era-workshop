#!/usr/bin/env node
// npm run qi:collect -- [runs] [--retries=N] — build a test-result history.
//
// Runs the browser suites (e2e + the flaky lab) several times on the SAME
// code, the way CI runs them on every push, and keeps each run's JUnit XML in
// labs/11-quality-intelligence/history/, as JUnit XML (what most CI tools
// read) and as Playwright's own JSON report. Quality intelligence starts with
// keeping results, not just looking at the latest one.
//
// --retries=1 runs the suites the way this repo's CI does (Topic 5).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const runs = Number(process.argv.slice(2).find((a) => /^\d+$/.test(a))) || 8;
const retries = process.argv.find((a) => a.startsWith('--retries='))?.split('=')[1] ?? '0';
const dir = 'labs/11-quality-intelligence/history';
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
const bin = path.resolve('node_modules/.bin/playwright');

for (let i = 1; i <= runs; i++) {
  const file = path.join(dir, `run-${String(i).padStart(2, '0')}.xml`);
  const res = spawnSync(bin, ['test', '--project=e2e', '--project=flaky', `--retries=${retries}`, '--reporter=junit,json'], {
    env: { ...process.env, PLAYWRIGHT_JUNIT_OUTPUT_FILE: file, PLAYWRIGHT_JSON_OUTPUT_NAME: file.replace(/\.xml$/, '.json'), CI: '' },
    encoding: 'utf8',
  });
  const failures = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').match(/<testsuites[^>]*failures="(\d+)"/)?.[1] : '?';
  console.log(`run ${String(i).padStart(2)}  ${res.status === 0 ? '✔ green' : `✖ ${failures} failed`}  → ${file}`);
}
console.log(`\n${runs} runs (retries=${retries}) kept in ${dir}/. Next: npm run qi:report`);
