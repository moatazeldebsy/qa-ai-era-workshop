// Test-result analysis for quality intelligence (Topic 11).
//
//   parseJUnit(xml)            → [{ id, name, file, outcome, seconds, message }]
//   parsePlaywrightJson(text)  → the same, plus outcome 'flaky' for retried passes
//   loadHistory(dir)           → [{ run, results }], preferring each run's JSON
//   summarize(history)         → per-test statistics across runs
//
// A test is flaky when the history shows it both passing and failing on the
// same code, or when it only passed on a retry (which JUnit can't show).
import fs from 'node:fs';
import path from 'node:path';

const unescape = (s) => s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

export function parseJUnit(xml) {
  const results = [];
  for (const [, attrs, body = ''] of xml.matchAll(/<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g)) {
    const attr = (name) => unescape(attrs.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? '');
    const failure = body.match(/<(failure|error)\b[^>]*?message="([^"]*)"/);
    const outcome = failure || /<(failure|error)\b/.test(body) ? 'failed' : /<skipped\b/.test(body) ? 'skipped' : 'passed';
    results.push({
      id: `${attr('classname')} › ${attr('name')}`,
      name: attr('name'),
      file: attr('classname'),
      outcome,
      seconds: Number(attr('time')) || 0,
      message: failure ? unescape(failure[2]) : '',
    });
  }
  return results;
}

// Playwright's own report knows about retries: a test whose final status is
// 'flaky' failed at least once and then passed.
export function parsePlaywrightJson(text) {
  const report = JSON.parse(text);
  const walk = (suite, titles) => [
    ...(suite.specs ?? []).flatMap((spec) =>
      spec.tests.map((t) => {
        const last = t.results.at(-1) ?? {};
        const failed = t.results.find((r) => r.status !== 'passed' && r.status !== 'skipped');
        return {
          id: `${spec.file} › ${[...titles, spec.title].join(' › ')}`,
          name: [...titles, spec.title].join(' › '),
          file: spec.file,
          outcome: t.status === 'flaky' ? 'flaky' : t.status === 'skipped' ? 'skipped' : t.status === 'expected' ? 'passed' : 'failed',
          seconds: (last.duration ?? 0) / 1000,
          message: failed?.error?.message?.split('\n')[0] ?? '',
        };
      }),
    ),
    ...(suite.suites ?? []).flatMap((child) => walk(child, [...titles, child.title])),
  ];
  return report.suites.flatMap((fileSuite) => walk(fileSuite, []));
}

export function loadHistory(dir) {
  const files = fs.readdirSync(dir);
  const runs = [...new Set(files.filter((f) => /\.(xml|json)$/.test(f)).map((f) => f.replace(/\.(xml|json)$/, '')))].sort();
  return runs.map((run) =>
    files.includes(`${run}.json`)
      ? { run, results: parsePlaywrightJson(fs.readFileSync(path.join(dir, `${run}.json`), 'utf8')) }
      : { run, results: parseJUnit(fs.readFileSync(path.join(dir, `${run}.xml`), 'utf8')) },
  );
}

export function summarize(history) {
  const latest = history.at(-1)?.results ?? [];
  const tests = new Map();
  for (const { results } of history) {
    for (const r of results) {
      const t = tests.get(r.id) ?? { id: r.id, runs: 0, passed: 0, failed: 0, retriedPasses: 0, seconds: 0 };
      t.runs += 1;
      t.seconds += r.seconds;
      if (r.outcome === 'passed') t.passed += 1;
      if (r.outcome === 'failed') t.failed += 1;
      if (r.outcome === 'flaky') (t.passed += 1), (t.retriedPasses += 1);
      tests.set(r.id, t);
    }
  }
  return [...tests.values()].map((t) => {
    const now = latest.find((r) => r.id === t.id);
    return {
      ...t,
      meanSeconds: t.seconds / t.runs,
      failureRate: t.failed / t.runs,
      failingNow: now?.outcome === 'failed',
      // Same code, different outcomes: across runs, or within one run's retries.
      flaky: (t.passed > 0 && t.failed > 0) || t.retriedPasses > 0,
    };
  });
}
