#!/usr/bin/env node
// npm run ci:pipeline — a tiny, local CI runner, so you can see how a
// pipeline works inside: stages, dependencies (a DAG), parallelism, what
// happens when a stage fails, and where the time goes.
//
// Reads labs/06-ci-cd/pipeline.json:
//   { "stages": [ { "id": "unit", "run": "npm run test:unit", "needs": [] }, ... ] }
//
//   needs   stages that must finish successfully first
//   always  run even if a needed stage failed (like `if: always()` in Actions):
//           a quality gate should still give its verdict when tests fail
//
// Starts by emptying test-results/, as a fresh CI runner would. Prints a
// timeline, the critical path and the speed-up over running everything one
// after another. Writes test-results/pipeline-run.json.
// Exit code 1 if any stage failed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const file = process.argv[2] ?? 'labs/06-ci-cd/pipeline.json';
const concurrency = Number(process.env.PIPELINE_CONCURRENCY) || Math.min(4, os.availableParallelism());
const { stages } = JSON.parse(fs.readFileSync(file, 'utf8'));
const byId = new Map(stages.map((s) => [s.id, { needs: [], ...s }]));

// ── Validate: unknown dependencies and cycles ───────────────────────────────
for (const s of byId.values()) {
  for (const n of s.needs) if (!byId.has(n)) fail(`stage "${s.id}" needs unknown stage "${n}"`);
}
const visiting = new Set();
const done = new Set();
const visit = (id, trail = []) => {
  if (done.has(id)) return;
  if (visiting.has(id)) fail(`dependency cycle: ${[...trail, id].join(' → ')}`);
  visiting.add(id);
  for (const n of byId.get(id).needs) visit(n, [...trail, id]);
  visiting.delete(id);
  done.add(id);
};
for (const id of byId.keys()) visit(id);

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(2);
}

// ── Run ──────────────────────────────────────────────────────────────────────
// A CI runner starts from a clean checkout, so evidence from earlier runs
// can't leak into this one's verdict. Do the same here.
fs.rmSync('test-results', { recursive: true, force: true });
console.log('Clean workspace: test-results/ emptied, like a fresh CI runner.\n');

const t0 = Date.now();
const result = new Map(); // id → { status, start, end, output }
const running = new Set();

const ready = (s) =>
  !result.has(s.id) &&
  !running.has(s.id) &&
  s.needs.every((n) => result.has(n)) &&
  (s.always || s.needs.every((n) => result.get(n).status === 'passed'));
const blocked = (s) => !result.has(s.id) && !running.has(s.id) && !s.always && s.needs.some((n) => ['failed', 'skipped'].includes(result.get(n)?.status));

function start(s) {
  running.add(s.id);
  const begin = Date.now() - t0;
  const child = spawn(s.run, { shell: true, env: { ...process.env, FORCE_COLOR: '0', CI: process.env.CI ?? '' } });
  let output = '';
  child.stdout.on('data', (d) => (output += d));
  child.stderr.on('data', (d) => (output += d));
  console.log(`▶ ${s.id.padEnd(14)} started  (${(begin / 1000).toFixed(1)}s)`);
  return new Promise((resolve) =>
    child.on('close', (code) => {
      running.delete(s.id);
      const end = Date.now() - t0;
      const status = code === 0 ? 'passed' : 'failed';
      result.set(s.id, { status, start: begin, end, output });
      console.log(`${status === 'passed' ? '✔' : '✖'} ${s.id.padEnd(14)} ${status} in ${((end - begin) / 1000).toFixed(1)}s`);
      resolve();
    }),
  );
}

const inFlight = new Set();
while (result.size < byId.size) {
  for (const s of byId.values()) {
    if (blocked(s)) {
      result.set(s.id, { status: 'skipped', start: null, end: null, output: '' });
      console.log(`⏭ ${s.id.padEnd(14)} skipped (a stage it needs did not pass)`);
    }
  }
  for (const s of byId.values()) {
    if (inFlight.size >= concurrency) break;
    if (ready(s)) {
      const p = start(s).then(() => inFlight.delete(p));
      inFlight.add(p);
    }
  }
  if (result.size < byId.size) {
    if (!inFlight.size) fail('nothing can run: check the needs of the remaining stages');
    await Promise.race(inFlight);
  }
}

// ── Report ───────────────────────────────────────────────────────────────────
const wall = Date.now() - t0;
const ran = [...result].filter(([, r]) => r.start !== null);
const sum = ran.reduce((n, [, r]) => n + (r.end - r.start), 0);
const scale = 50 / Math.max(wall, 1);
console.log(`\nTimeline (each █ ≈ ${(wall / 50 / 1000).toFixed(2)}s, concurrency ${concurrency})`);
for (const [id, r] of result) {
  if (r.start === null) {
    console.log(`${id.padEnd(14)} ${'(skipped)'}`);
    continue;
  }
  const bar = ' '.repeat(Math.round(r.start * scale)) + (r.status === 'passed' ? '█' : '▓').repeat(Math.max(1, Math.round((r.end - r.start) * scale)));
  console.log(`${id.padEnd(14)} ${bar} ${((r.end - r.start) / 1000).toFixed(1)}s`);
}

// Critical path: the longest chain of measured durations through the DAG.
const memo = new Map();
const longest = (id) => {
  if (memo.has(id)) return memo.get(id);
  const r = result.get(id);
  const own = r.start === null ? 0 : r.end - r.start;
  const best = byId.get(id).needs.map(longest).reduce((a, b) => (a.ms > b.ms ? a : b), { ms: 0, path: [] });
  const v = { ms: best.ms + own, path: [...best.path, id] };
  memo.set(id, v);
  return v;
};
const critical = [...byId.keys()].map(longest).reduce((a, b) => (a.ms > b.ms ? a : b));

console.log(`\nWall-clock time      ${(wall / 1000).toFixed(1)}s`);
console.log(`One after another    ${(sum / 1000).toFixed(1)}s`);
console.log(`Speed-up             ${(sum / wall).toFixed(2)}×`);
console.log(`Critical path        ${critical.path.join(' → ')} (${(critical.ms / 1000).toFixed(1)}s)`);

const failed = [...result].filter(([, r]) => r.status === 'failed');
for (const [id, r] of failed) console.log(`\n── ${id} output (last 15 lines) ──\n${r.output.trim().split('\n').slice(-15).join('\n')}`);

fs.mkdirSync('test-results', { recursive: true });
fs.writeFileSync(
  'test-results/pipeline-run.json',
  JSON.stringify(
    {
      wallMs: wall,
      sumMs: sum,
      speedup: sum / wall,
      critical: critical.path,
      stages: Object.fromEntries([...result].map(([id, r]) => [id, { status: r.status, ms: r.start === null ? null : r.end - r.start }])),
    },
    null,
    2,
  ),
);
console.log(failed.length ? `\n✖ ${failed.length} stage(s) failed` : '\n✔ Pipeline passed');
process.exit(failed.length ? 1 : 0);
