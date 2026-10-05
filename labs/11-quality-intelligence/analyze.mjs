// Test-result analysis for quality intelligence (Topic 11).
//
//   parseJUnit(xml)      → [{ id, name, file, outcome, seconds, message }]
//   loadHistory(dir)     → [{ run, results }] for every run file in a folder
//   summarize(history)   → per-test statistics across runs
//
// Written as a first version: it reports what the LATEST run says. The lab
// asks you to make it see what the whole history says.
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

export function loadHistory(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.xml'))
    .sort()
    .map((f) => ({ run: f, results: parseJUnit(fs.readFileSync(path.join(dir, f), 'utf8')) }));
}

export function summarize(history) {
  const latest = history.at(-1)?.results ?? [];
  const tests = new Map();
  for (const { results } of history) {
    for (const r of results) {
      const t = tests.get(r.id) ?? { id: r.id, runs: 0, passed: 0, failed: 0, seconds: 0 };
      t.runs += 1;
      t.seconds += r.seconds;
      if (r.outcome === 'passed') t.passed += 1;
      if (r.outcome === 'failed') t.failed += 1;
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
      flaky: false, // TODO(Topic 11, step 2): what does the history say?
    };
  });
}
