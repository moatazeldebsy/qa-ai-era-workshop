import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseJUnit, summarize } from '../analyze.mjs';

// Learning Path, Topic 11 — analysing test results. The fixtures are real
// reports from this repo's flaky lab (local paths removed).

const read = (f) => fs.readFileSync(new URL(`./fixtures/${f}`, import.meta.url), 'utf8');
const BAD = 'labs/05-ui-e2e/flaky/tests/recommendations.bad.spec.js › BAD: sleeps a fixed time, then asserts once';
const run = (name, file) => ({ run: name, results: parseJUnit(read(file)) });

describe('reading JUnit', () => {
  test('every test case becomes a result with its outcome and time', () => {
    const results = parseJUnit(read('run-failing.xml'));
    const bad = results.find((r) => r.id === BAD);
    assert.equal(bad.outcome, 'failed');
    assert.match(bad.message, /toBe/);
    assert.ok(results.filter((r) => r.outcome === 'passed').length > 10);
    assert.ok(results.every((r) => r.seconds >= 0));
  });
});

describe('across runs', () => {
  test('a test that always passes is neither failing nor flaky', () => {
    const t = summarize([run('1', 'run-passing.xml'), run('2', 'run-passing.xml')]).find((x) => x.id.includes('lists every book'));
    assert.equal(t.failingNow, false);
    assert.equal(t.flaky, false);
  });

  // Found by looking at a week of runs instead of the last one: the same test
  // on the same code passed 5 times and failed 7. The report called it "not
  // failing" or "failing" depending on which run happened to be last.
  test(
    'a test that passed in some runs and failed in others is flaky, with its failure rate',
    () => {
      const history = [run('1', 'run-failing.xml'), run('2', 'run-passing.xml'), run('3', 'run-failing.xml'), run('4', 'run-passing.xml')];
      const bad = summarize(history).find((x) => x.id === BAD);
      assert.equal(bad.flaky, true);
      assert.equal(bad.failureRate, 0.5);
    },
  );

  // Found by comparing CI's JUnit with Playwright's own report: with
  // retries: 1, a test that failed and then passed on retry is just
  // "passed" in JUnit. Only Playwright's JSON report says "flaky".
  test(
    'a test that only passed on retry counts as flaky (Playwright JSON report)',
    async () => {
      const { parsePlaywrightJson } = await import('../analyze.mjs');
      assert.equal(typeof parsePlaywrightJson, 'function', 'analyze.mjs has no parsePlaywrightJson yet');
      const results = parsePlaywrightJson(read('retried-run.json'));
      const bad = results.find((r) => r.id === BAD);
      assert.equal(bad.outcome, 'flaky');
      const t = summarize([{ run: 'ci', results }]).find((x) => x.id === BAD);
      assert.equal(t.flaky, true);
    },
  );
});
