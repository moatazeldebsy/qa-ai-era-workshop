import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// Learning Path, Topic 6 — testing the quality gate itself.
//
// The gate decides whether a release ships, so it deserves tests like any
// other code. Each test builds a results folder with the evidence a pipeline
// would produce, runs the gate on it (RESULTS_DIR), and checks the verdict.

const GATE = path.resolve('labs/06-ci-cd/quality-gate/gate.mjs');

function junit({ tests, failures = 0, skipped = 0 }) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites tests="${tests}" failures="${failures}" errors="0" skipped="${skipped}" time="3.2"></testsuites>\n`;
}

// Evidence dated 2001 is older than any checkout of this repository.
const LONG_AGO = new Date('2001-01-01T00:00:00Z');

function runGate(files, { old = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-'));
  for (const [name, content] of Object.entries(files)) {
    const p = path.join(dir, name);
    fs.writeFileSync(p, content);
    if (old) fs.utimesSync(p, LONG_AGO, LONG_AGO);
  }
  const res = spawnSync(process.execPath, [GATE], { env: { ...process.env, RESULTS_DIR: dir, GITHUB_STEP_SUMMARY: '' }, encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true, force: true });
  return { ready: res.status === 0, output: res.stdout + res.stderr };
}

describe('the quality gate', () => {
  test('a fully green run is ready to release', () => {
    const { ready, output } = runGate({ 'junit.xml': junit({ tests: 38 }) });
    assert.equal(ready, true, output);
  });

  test('one failing test blocks the release', () => {
    assert.equal(runGate({ 'junit.xml': junit({ tests: 38, failures: 1 }) }).ready, false);
  });

  test('no functional evidence at all blocks the release', () => {
    assert.equal(runGate({}).ready, false);
  });

  // Found by asking "how could someone make this gate green without the
  // product being ready?" Skip the failing tests. 37 of 38 skipped is today
  // a ✅ READY TO RELEASE.
  test(
    'skipping most of the tests does not make a release ready',
    { todo: 'real gap: the gate ignores skipped tests; Topic 6 lab, step 3' },
    () => {
      const { ready, output } = runGate({ 'junit.xml': junit({ tests: 38, skipped: 37 }) });
      assert.equal(ready, false, output);
    },
  );

  // Found by running the gate twice: the evidence in test-results/ stays
  // there between runs. Results from last week's code still say "ready".
  test(
    'evidence older than the code is not trusted',
    { todo: 'real gap: the gate trusts results of any age; Topic 6 lab, step 3' },
    () => {
      const { ready, output } = runGate({ 'junit.xml': junit({ tests: 38 }) }, { old: true });
      assert.equal(ready, false, output);
      assert.match(output, /stale|older than/i);
    },
  );
});
