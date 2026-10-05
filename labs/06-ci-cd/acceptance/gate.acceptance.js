import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const GATE = path.resolve('labs/06-ci-cd/quality-gate/gate.mjs');
const junit = (tests, skipped = 0, failures = 0) =>
  `<testsuites tests="${tests}" failures="${failures}" errors="0" skipped="${skipped}"></testsuites>`;

// Evidence dated 2001 is older than any checkout of this repository.
const LONG_AGO = new Date('2001-01-01T00:00:00Z');

function gate(files, { old = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-acc-'));
  for (const [name, content] of Object.entries(files)) {
    const p = path.join(dir, name);
    fs.writeFileSync(p, content);
    if (old) fs.utimesSync(p, LONG_AGO, LONG_AGO);
  }
  const res = spawnSync(process.execPath, [GATE], { env: { ...process.env, RESULTS_DIR: dir, GITHUB_STEP_SUMMARY: '' }, encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true, force: true });
  return res.status === 0;
}

test('fresh, fully green evidence is ready', () => assert.equal(gate({ 'junit.xml': junit(120) }), true));
test('a mostly skipped run is blocked', () => assert.equal(gate({ 'junit.xml': junit(120, 100) }), false));
test('half the suite skipped is blocked', () => assert.equal(gate({ 'junit.xml': junit(120, 60) }), false));
test('green evidence from before the last code change is blocked', () => {
  assert.equal(gate({ 'junit.xml': junit(120) }, { old: true }), false);
});
test('stale optional evidence is not trusted either', () => {
  const evalJson = JSON.stringify({ results: { stats: { successes: 9, failures: 0, errors: 0 } } });
  const dir = { 'junit.xml': junit(120), 'llm-eval.json': evalJson };
  // junit fresh, llm-eval old
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-acc-'));
  fs.writeFileSync(path.join(tmp, 'junit.xml'), dir['junit.xml']);
  fs.writeFileSync(path.join(tmp, 'llm-eval.json'), evalJson);
  fs.utimesSync(path.join(tmp, 'llm-eval.json'), LONG_AGO, LONG_AGO);
  const res = spawnSync(process.execPath, [GATE], { env: { ...process.env, RESULTS_DIR: tmp, GITHUB_STEP_SUMMARY: '' }, encoding: 'utf8' });
  fs.rmSync(tmp, { recursive: true, force: true });
  assert.notEqual(res.status, 0, res.stdout);
});
