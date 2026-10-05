import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as analyze from '../analyze.mjs';

const fixtures = new URL('../tests/fixtures/', import.meta.url);
const read = (f) => fs.readFileSync(new URL(f, fixtures), 'utf8');
const BAD = 'labs/05-ui-e2e/flaky/tests/recommendations.bad.spec.js › BAD: sleeps a fixed time, then asserts once';
const junit = (f) => ({ run: f, results: analyze.parseJUnit(read(f)) });

test('a test that fails every run is failing, not flaky', () => {
  const t = analyze.summarize([junit('run-failing.xml'), junit('run-failing.xml'), junit('run-failing.xml')]).find((x) => x.id === BAD);
  assert.equal(t.flaky, false);
  assert.equal(t.failingNow, true);
  assert.equal(t.failureRate, 1);
});

test('flakiness is found wherever in the history the failures are, with the right rate', () => {
  const history = [junit('run-passing.xml'), junit('run-passing.xml'), junit('run-failing.xml'), junit('run-passing.xml')];
  const t = analyze.summarize(history).find((x) => x.id === BAD);
  assert.equal(t.flaky, true);
  assert.equal(t.failureRate, 0.25);
  assert.equal(t.failingNow, false);
});

test('a history folder mixing JUnit and Playwright JSON runs finds the retried pass', () => {
  assert.equal(typeof analyze.parsePlaywrightJson, 'function');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qi-'));
  fs.writeFileSync(path.join(dir, 'run-01.xml'), read('run-passing.xml'));
  fs.writeFileSync(path.join(dir, 'run-02.json'), read('retried-run.json'));
  const history = analyze.loadHistory(dir);
  fs.rmSync(dir, { recursive: true, force: true });
  assert.equal(history.length, 2);
  const t = analyze.summarize(history).find((x) => x.id === BAD);
  assert.equal(t.flaky, true, 'a pass that needed a retry is flakiness');
});

test('JSON and JUnit name the same test the same way', () => {
  const fromJson = analyze.parsePlaywrightJson(read('retried-run.json')).map((r) => r.id).sort();
  const fromJunit = analyze.parseJUnit(read('run-passing.xml')).map((r) => r.id).filter((id) => id.includes('/flaky/')).sort();
  assert.deepEqual(fromJson, fromJunit);
});
