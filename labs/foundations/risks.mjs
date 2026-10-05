#!/usr/bin/env node
// npm run foundations:risks — rank the risk register and prove its trace.
//
// For each risk: score = likelihood x impact, then check that every listed
// check really exists (its title appears in its file). Exit code 1 when:
//   - a check points at a missing file or a title that isn't there (a broken
//     trace is worse than none: it claims coverage that doesn't exist), or
//   - a risk at or above the threshold has no checks at all.
// Risks below the threshold with no checks are reported as gaps, not failures.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const registerPath = process.argv[2] ?? path.join(root, 'labs/foundations/risk-register.json');
const { threshold, risks } = JSON.parse(fs.readFileSync(registerPath, 'utf8'));

const problems = [];
const rows = risks
  .map((r) => {
    for (const field of ['likelihood', 'impact']) {
      if (!Number.isInteger(r[field]) || r[field] < 1 || r[field] > 5) problems.push(`${r.id}: ${field} must be an integer from 1 to 5`);
    }
    const broken = r.checks.filter(({ file, title }) => {
      const full = path.join(root, file);
      return !fs.existsSync(full) || !fs.readFileSync(full, 'utf8').includes(title);
    });
    for (const c of broken) problems.push(`${r.id}: check not found — "${c.title}" in ${c.file}`);
    const score = r.likelihood * r.impact;
    const live = r.checks.length - broken.length;
    let status = 'covered';
    if (live === 0 && score >= threshold) {
      status = 'UNCOVERED';
      problems.push(`${r.id}: score ${score} ≥ ${threshold} and no working check — "${r.risk}"`);
    } else if (live === 0) status = 'gap';
    return { ...r, score, live, status };
  })
  .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

const pad = (s, n) => String(s).padEnd(n);
console.log(`\nRisk register — ${rows.length} risks, must-cover threshold ${threshold}\n`);
console.log(`${pad('ID', 4)}${pad('L×I', 7)}${pad('Score', 7)}${pad('Checks', 8)}${pad('Status', 11)}Risk`);
for (const r of rows) {
  console.log(`${pad(r.id, 4)}${pad(`${r.likelihood}×${r.impact}`, 7)}${pad(r.score, 7)}${pad(r.live, 8)}${pad(r.status, 11)}${r.risk}`);
}

const gaps = rows.filter((r) => r.status === 'gap');
if (gaps.length) console.log(`\nGaps below the threshold (decide: accept, or add a check): ${gaps.map((r) => r.id).join(', ')}`);

if (problems.length) {
  console.log('\n✖ Problems:');
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log('\n✔ Every risk at or above the threshold traces to a check that exists.');
