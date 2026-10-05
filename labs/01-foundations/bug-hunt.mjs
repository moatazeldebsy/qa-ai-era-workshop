#!/usr/bin/env node
// npm run foundations:bug-hunt — would our tests notice a real bug?
//
// Runs the Topic 1 oracle tests twice: once on the correct code, once with
// BUG_MODE=cart (a planted regression: free shipping decided on the most
// expensive single copy instead of the subtotal). A good suite is green on the
// first run and red on the second. This prints which tests caught the bug and
// which stayed green — the second list shows each oracle's blind spots.
//
// Exit code 0 only when the clean run passes AND the bug is caught.
import { run } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const files = [path.join(here, 'tests', 'oracles.test.js')];

async function runSuite(bugMode) {
  // Test files run in child processes that inherit this environment.
  if (bugMode) process.env.BUG_MODE = bugMode;
  else delete process.env.BUG_MODE;
  const passed = [];
  const failed = [];
  for await (const event of run({ files })) {
    const { name, nesting, todo, details } = event.data ?? {};
    // Leaf tests only (describe blocks are nesting 0), and skip TODOs: they
    // record known findings, not checks of this run.
    if (nesting !== 1 || todo || details?.type === 'suite') continue;
    if (event.type === 'test:pass') passed.push(name);
    if (event.type === 'test:fail') failed.push(name);
  }
  return { passed, failed };
}

const clean = await runSuite(undefined);
console.log(`\nClean code:       ${clean.passed.length} passed, ${clean.failed.length} failed`);
if (clean.failed.length) {
  console.log('✖ The suite must pass on correct code first. Failing:');
  for (const n of clean.failed) console.log(`  - ${n}`);
  process.exit(1);
}

const buggy = await runSuite('cart');
console.log(`BUG_MODE=cart:    ${buggy.passed.length} passed, ${buggy.failed.length} failed\n`);
console.log('Caught the bug (red on buggy code):');
for (const n of buggy.failed) console.log(`  ✔ ${n}`);
console.log('\nBlind to the bug (still green):');
for (const n of buggy.passed) console.log(`  · ${n}`);

if (!buggy.failed.length) {
  console.log('\n✖ The bug escaped: no test noticed it.');
  process.exit(1);
}
console.log(`\n✔ Bug caught by ${buggy.failed.length} of ${buggy.failed.length + buggy.passed.length} tests.`);
