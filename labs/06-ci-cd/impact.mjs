#!/usr/bin/env node
// npm run ci:impact -- [changed files...] — test impact analysis (TIA).
//
// Which test suites could be affected by a change? This script answers it
// the way many real tools start: follow each test file's `import`s through
// the source tree, and select a suite when a changed file is among its
// (transitive) dependencies. Rules in impact.config.json add dependencies
// that imports can't see.
//
//   npm run ci:impact -- app/src/cart.js           explicit list of changed files
//   npm run ci:impact                              changed files from `git diff` against main
//   npm run ci:impact -- --json app/src/cart.js    machine-readable output
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'labs/06-ci-cd/impact.config.json'), 'utf8'));
const args = process.argv.slice(2);
const json = args.includes('--json');
let changed = args.filter((a) => !a.startsWith('--'));
if (!changed.length) {
  const out = execFileSync('git', ['diff', '--name-only', 'main', '--'], { cwd: root, encoding: 'utf8' });
  changed = out.split('\n').filter(Boolean);
}

const rel = (p) => path.relative(root, p).split(path.sep).join('/');
const IMPORT = /(?:import\s[^'"]*?from\s*|import\s*\(\s*|^\s*import\s*)['"](\.{1,2}\/[^'"]+)['"]/gm;

// All local files a file depends on, following relative imports.
const deps = new Map();
function dependencies(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  if (!fs.existsSync(file) || !/\.(m?js)$/.test(file)) return seen;
  for (const [, spec] of fs.readFileSync(file, 'utf8').matchAll(IMPORT)) {
    dependencies(path.resolve(path.dirname(file), spec), seen);
  }
  return seen;
}

// Glob → RegExp, enough for this repo: ** (any depth), * (one segment).
const globToRegExp = (glob) =>
  new RegExp(`^${glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*\/?/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*')}$`);
const matches = (file, globs) => globs.some((g) => globToRegExp(g).test(file));

// Expand "dir/*.test.js"-style patterns (one directory, a file-name glob).
const expand = (pattern) => {
  const dir = path.join(root, path.dirname(pattern));
  const name = globToRegExp(path.basename(pattern));
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => name.test(f)).map((f) => path.join(dir, f)) : [];
};

const report = [];
for (const [suite, { tests }] of Object.entries(config.suites)) {
  const files = expand(tests);
  const all = new Set();
  for (const f of files) for (const d of dependencies(f)) all.add(rel(d));
  deps.set(suite, all);
  const reasons = [];
  for (const c of changed) {
    if (all.has(c)) reasons.push(`${c} (imported)`);
    for (const rule of config.rules ?? []) {
      if (rule.suite === suite && matches(c, rule.when)) reasons.push(`${c} (rule: ${rule.why ?? rule.when.join(', ')})`);
    }
  }
  report.push({ suite, run: reasons.length > 0, reasons: [...new Set(reasons)], files: files.length });
}

if (json) {
  console.log(JSON.stringify({ changed, suites: report }, null, 2));
} else {
  console.log(`Changed: ${changed.join(', ') || '(nothing)'}\n`);
  for (const r of report) {
    console.log(`${r.run ? '▶ run ' : '· skip'}  ${r.suite.padEnd(14)} ${r.run ? r.reasons.join('; ') : ''}`);
  }
  const n = report.filter((r) => r.run).length;
  console.log(`\n${n} of ${report.length} suites selected.`);
}
