#!/usr/bin/env node
// npm run doctor - is this machine ready for the course?
//
// Checks every tool the labs need and says exactly how to fix what's missing.
// Exit code 1 when something REQUIRED is missing; optional items only warn.
// Deliberately dependency-free, so it works before `npm install` has run.
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 3210;
const results = [];
const add = (status, name, detail, fix = '') => results.push({ status, name, detail, fix });

const run = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
};
const atLeast = (version, min) => {
  const a = version.split('.').map(Number);
  const b = min.split('.').map(Number);
  for (let i = 0; i < b.length; i++) {
    if ((a[i] ?? 0) !== b[i]) return (a[i] ?? 0) > b[i];
  }
  return true;
};

// Node.js - promptfoo (Topic 12) needs 22.22+
const node = process.versions.node;
atLeast(node, '22.22.0')
  ? add('ok', 'Node.js', `v${node}`)
  : add('fail', 'Node.js', `v${node} (need ≥ 22.22)`, 'nvm install && nvm use   (reads .nvmrc)');

// npm dependencies
fs.existsSync(path.join(root, 'node_modules', '@playwright', 'test'))
  ? add('ok', 'npm dependencies', 'installed')
  : add('fail', 'npm dependencies', 'not installed', 'npm install');

// Playwright's Chromium
let chromium = null;
try {
  const { chromium: c } = await import('@playwright/test');
  chromium = c.executablePath();
} catch {
  /* reported via npm dependencies */
}
if (chromium && fs.existsSync(chromium)) add('ok', 'Playwright Chromium', 'installed');
else add('fail', 'Playwright Chromium', 'missing', 'npx playwright install --with-deps chromium');

// k6 - Topic 8 and the quality gate's performance check
const k6 = run('k6', ['version']);
k6
  ? add('ok', 'k6', k6.split('\n')[0].replace(/^k6 /, ''))
  : add('warn', 'k6', 'not found (Topic 8)', 'brew install k6 · winget install k6 · grafana.com/docs/k6/latest/set-up/install-k6');

// Python - Topic 11
const py = run('python3', ['--version']) || run('python', ['--version']);
const pyVersion = py?.match(/(\d+\.\d+(\.\d+)?)/)?.[1];
pyVersion && atLeast(pyVersion, '3.9')
  ? add('ok', 'Python', pyVersion)
  : add('warn', 'Python', py ? `${pyVersion} (need ≥ 3.9, Topic 11)` : 'not found (Topic 11)', 'brew install python');

// Port - the most common first-hour problem
// Try to CONNECT, on IPv4 and IPv6, rather than to bind: Docker Desktop
// listens on the IPv6 wildcard, so binding 127.0.0.1 succeeds while
// Playwright's requests to localhost still land on the other program.
const connects = (host) =>
  new Promise((resolve) => {
    const socket = net.connect({ port: PORT, host });
    socket.setTimeout(1000);
    socket.once('connect', () => (socket.destroy(), resolve(true)));
    socket.once('timeout', () => (socket.destroy(), resolve(false)));
    socket.once('error', () => resolve(false));
  });
const portState = (await connects('127.0.0.1')) || (await connects('::1')) ? 'busy' : 'free';
if (portState === 'free') {
  add('ok', `Port ${PORT}`, 'free');
} else {
  let ours = false;
  try {
    const res = await fetch(`http://localhost:${PORT}/health`, { signal: AbortSignal.timeout(2000) });
    ours = res.ok && (await res.json()).status === 'ok';
  } catch {
    /* not ours */
  }
  ours
    ? add('ok', `Port ${PORT}`, 'the demo app is already running')
    : add('fail', `Port ${PORT}`, 'used by another program', `stop it, or use another port: PORT=3300 npm start / PORT=3300 npm test`);
}

// Optional: a real model (Labs 3, 6, 9)
process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN
  ? add('ok', 'Anthropic API key', 'set (real-model modes and the Topic 12 agent with a real model)')
  : add('info', 'Anthropic API key', 'not set: fine, every lab works without it');

// Optional: docs
const mkdocs = run('mkdocs', ['--version']);
mkdocs
  ? add('ok', 'MkDocs', mkdocs.match(/version (\S+)/)?.[1] ?? 'installed')
  : add('info', 'MkDocs', 'not installed: only needed to preview the docs locally', 'pip install -r requirements-docs.txt');

// ── Report ────────────────────────────────────────────────────────────────────
const icon = { ok: '✅', warn: '⚠️ ', fail: '❌', info: 'ℹ️ ' };
console.log('\nQA Engineering Deep Dive — doctor\n');
for (const r of results) {
  console.log(`${icon[r.status]} ${r.name.padEnd(22)} ${r.detail}`);
  if (r.fix && r.status !== 'ok') console.log(`   ${' '.repeat(22)} → ${r.fix}`);
}
const failed = results.filter((r) => r.status === 'fail').length;
const warned = results.filter((r) => r.status === 'warn').length;
console.log(
  failed
    ? `\n${failed} required item(s) missing. Fix them, then run  npm run doctor  again.\n`
    : `\nReady for the course${warned ? ` (${warned} optional item(s) missing — see above)` : ''}. Next:  npm test\n`,
);
process.exit(failed ? 1 : 0);
