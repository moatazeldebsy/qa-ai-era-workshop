#!/usr/bin/env node
// npm run design:mutants — which test-design technique catches which bug?
//
// A tiny mutation-testing run. Each MUTANT is one small, realistic bug planted
// in a copy of the app (never in your working tree). For every mutant, each
// technique's test file runs against the mutated copy; a failing run means
// that technique "killed" the mutant. The scorecard shows that the techniques
// find different bugs, so a good suite uses several.
//
// Exit code 1 when the clean copy fails, or when a mutant survives every
// technique (the lab's suite is meant to kill them all).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const TECHNIQUES = {
  'EP/BVA': 'partitions.test.js',
  'Decision table': 'decision-table.test.js',
  'State transition': 'state-transition.test.js',
  'Property-based': 'properties.test.js',
};

const MUTANTS = [
  { id: 'M1', what: 'max quantity 10 → 11', file: 'app/src/cart.js', from: 'quantity > 10', to: 'quantity > 11' },
  { id: 'M2', what: 'min quantity 1 → 0', file: 'app/src/cart.js', from: 'quantity < 1 ||', to: 'quantity < 0 ||' },
  { id: 'M3', what: 'stock check off by one', file: 'app/src/cart.js', from: 'quantity > book.stock', to: 'quantity > book.stock + 1' },
  { id: 'M4', what: 'free shipping at > 50, not >= 50', file: 'app/src/cart.js', from: 'return subtotal >= FREE_SHIPPING_THRESHOLD', to: 'return subtotal > FREE_SHIPPING_THRESHOLD' },
  { id: 'M5', what: 'line totals not rounded to cents', file: 'app/src/cart.js', from: 'lineTotal: round(book.price * quantity)', to: 'lineTotal: book.price * quantity' },
  { id: 'M6', what: 'shipping decided per copy (BUG_MODE=cart)', file: 'app/src/cart.js', from: "bugMode === 'cart' ?", to: 'true ?' },
  { id: 'M7', what: 'shipped orders can be cancelled', file: 'app/src/orders.js', from: "shipped: { deliver: 'delivered' }", to: "shipped: { deliver: 'delivered', cancel: 'cancelled' }" },
  { id: 'M8', what: 'refund window ends on day 29', file: 'app/src/orders.js', from: 'daysSinceDelivery > RETURN_WINDOW_DAYS', to: 'daysSinceDelivery >= RETURN_WINDOW_DAYS' },
  {
    id: 'M9',
    what: 'damaged books refunded after the window',
    file: 'app/src/orders.js',
    from: "  if (daysSinceDelivery > RETURN_WINDOW_DAYS) return { refund: false, reason: 'outside the 30-day window' };\n  if (arrivedDamaged) return { refund: true, reason: 'arrived damaged' };",
    to: "  if (arrivedDamaged) return { refund: true, reason: 'arrived damaged' };\n  if (daysSinceDelivery > RETURN_WINDOW_DAYS) return { refund: false, reason: 'outside the 30-day window' };",
  },
  {
    id: 'M10',
    what: 'assistant checks off-topic before injection',
    file: 'app/src/assistant.js',
    from: "  if (INJECTION.test(q)) return \"I can't share my instructions, but I'm happy to help with books, orders, shipping or returns.\";\n  if (OFF_TOPIC.test(q)) return 'I can only help with questions about Quality Books - our books, orders, shipping and returns.';",
    to: "  if (OFF_TOPIC.test(q)) return 'I can only help with questions about Quality Books - our books, orders, shipping and returns.';\n  if (INJECTION.test(q)) return \"I can't share my instructions, but I'm happy to help with books, orders, shipping or returns.\";",
  },
];

// The sandbox mirrors the repo layout the tests import from.
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-mutants-'));
for (const p of ['app/src', 'labs/02-test-design', 'package.json']) fs.cpSync(path.join(root, p), path.join(sandbox, p), { recursive: true });
fs.symlinkSync(path.join(root, 'node_modules'), path.join(sandbox, 'node_modules'), 'dir');

const env = { ...process.env, FC_SEED: '20261005' };
delete env.BUG_MODE;
const passes = (testFile) =>
  spawnSync(process.execPath, ['--test', path.join('labs/02-test-design/tests', testFile)], { cwd: sandbox, env, stdio: 'ignore' }).status === 0;

let exitCode = 0;
try {
  const broken = Object.entries(TECHNIQUES).filter(([, f]) => !passes(f));
  if (broken.length) {
    console.log(`✖ On correct code these must pass first: ${broken.map(([t]) => t).join(', ')}`);
    process.exit(1);
  }

  const results = [];
  for (const m of MUTANTS) {
    const target = path.join(sandbox, m.file);
    const original = fs.readFileSync(target, 'utf8');
    if (!original.includes(m.from)) throw new Error(`${m.id}: code to mutate not found in ${m.file}; was the file changed?`);
    fs.writeFileSync(target, original.replace(m.from, m.to));
    const killedBy = Object.entries(TECHNIQUES).filter(([, f]) => !passes(f)).map(([t]) => t);
    fs.writeFileSync(target, original);
    results.push({ ...m, killedBy });
  }

  const names = Object.keys(TECHNIQUES);
  const pad = (s, n) => String(s).padEnd(n);
  console.log(`\n${pad('Mutant', 52)}${names.map((n) => pad(n, 18)).join('')}`);
  for (const r of results) {
    console.log(`${pad(`${r.id} ${r.what}`, 52)}${names.map((n) => pad(r.killedBy.includes(n) ? '✔ killed' : '·', 18)).join('')}`);
  }
  console.log(`${pad('Killed by this technique', 52)}${names.map((n) => pad(`${results.filter((r) => r.killedBy.includes(n)).length}/${results.length}`, 18)).join('')}`);

  const survivors = results.filter((r) => !r.killedBy.length);
  if (survivors.length) {
    console.log(`\n✖ Survived every technique: ${survivors.map((r) => `${r.id} (${r.what})`).join(', ')}`);
    exitCode = 1;
  } else {
    console.log(`\n✔ All ${results.length} mutants killed. No single technique killed them all.`);
  }
} finally {
  fs.rmSync(sandbox, { recursive: true, force: true });
}
process.exit(exitCode);
