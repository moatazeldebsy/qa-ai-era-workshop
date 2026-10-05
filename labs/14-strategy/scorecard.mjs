#!/usr/bin/env node
// npm run strategy:scorecard — a one-page quality scorecard for Quality Books,
// built from live evidence in this repository, not from opinion.
//
// Sections: the test portfolio (how many checks at each level), risk
// traceability (and whether each risk's evidence can detect it), fleet
// conformance, release gate thresholds, and production dependencies.
// Writes test-results/scorecard.md.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { STANDARDS, checkService } from '../../platform/conformance.mjs';

process.env.LOG_REQUESTS = 'false';
process.env.NODE_ENV ??= 'test';
const lines = [];
const out = (s = '') => lines.push(s);

// ── 1. Test portfolio: a static count of tests per level ─────────────────────
const count = (dir, pattern = /\.(test|spec)\.js$/, re = /^\s*(?:test|it)\s*\(/gm) => {
  if (!fs.existsSync(dir)) return 0;
  return fs
    .readdirSync(dir, { recursive: true })
    .filter((f) => pattern.test(f) && !String(f).includes('node_modules'))
    .reduce((n, f) => n + (fs.readFileSync(path.join(dir, f), 'utf8').match(re) ?? []).length, 0);
};
const yamlCases = (file) => (fs.existsSync(file) ? (fs.readFileSync(file, 'utf8').match(/^\s*- description:/gm) ?? []).length : 0);
const portfolio = [
  ['Unit and component', count('app/test') + count('labs/01-foundations/tests') + count('labs/02-test-design/tests') + count('labs/03-unit-component/tests')],
  ['Integration and contract', count('labs/04-integration-contract/tests') + count('labs/08-performance/tests') + count('labs/10-observability/tests')],
  ['API (out of process)', count('labs/04-integration-contract/api')],
  ['Browser E2E', count('labs/05-ui-e2e/e2e/tests')],
  ['Accessibility', count('labs/09-security-a11y/a11y')],
  ['Security', count('labs/09-security-a11y/tests')],
  ['LLM evals and red team', yamlCases('labs/12-ai-in-qa/llm-eval/promptfooconfig.yaml') + yamlCases('labs/12-ai-in-qa/llm-eval/redteam-cases.yaml')],
  ['Load scenarios (k6 scripts)', fs.readdirSync('labs/08-performance/k6').filter((f) => f.endsWith('.js')).length],
];
const widest = Math.max(...portfolio.map(([, n]) => n));
out('## 1. Test portfolio (static count of test() calls; a data-driven loop counts once)');
out('');
for (const [level, n] of portfolio) out(`${level.padEnd(30)} ${String(n).padStart(4)}  ${'█'.repeat(Math.round((n / widest) * 30))}`);

// ── 2. Risk traceability, and whether the evidence fits the risk ─────────────
// Some kinds of risk can only be detected by some kinds of evidence: a
// performance risk needs a check that measures time.
const FIT = {
  'Performance efficiency': { pattern: /duration|p\(9\d\)|latency|ms\b/i, need: 'a check that measures time' },
};
const { risks, threshold } = JSON.parse(fs.readFileSync('labs/01-foundations/risk-register.json', 'utf8'));
out('');
out('## 2. Risks and their evidence');
out('');
const misfits = [];
for (const r of [...risks].sort((a, b) => b.likelihood * b.impact - a.likelihood * a.impact)) {
  const score = r.likelihood * r.impact;
  const fit = FIT[r.attribute];
  const fits = !fit || r.checks.some((c) => fit.pattern.test(c.title));
  if (!fits) misfits.push(`${r.id}: ${r.attribute} risk needs ${fit.need}; linked: ${r.checks.map((c) => c.title).join(', ') || 'nothing'}`);
  const status = !r.checks.length ? (score >= threshold ? 'UNCOVERED' : 'gap') : fits ? 'traced' : 'WRONG EVIDENCE';
  out(`${r.id.padEnd(4)} ${String(score).padStart(2)}  ${status.padEnd(15)} ${r.risk}`);
}
for (const m of misfits) out(`  ⚠ ${m}`);

// ── 3. Fleet conformance (Topic 13) ──────────────────────────────────────────
out('');
out('## 3. Platform standards across the fleet');
out('');
const fleet = [['shop', (await import('../../app/src/server.js')).createApp()], ['inventory', (await import('../../services/inventory/src/app.js')).createInventoryApp()]];
const realError = console.error;
console.error = () => {}; // the conformance checks send bad requests on purpose
for (const [name, app] of fleet) {
  const results = await checkService(app);
  out(`${name.padEnd(12)} ${results.filter((r) => r.ok).length}/${STANDARDS.length} standards  ${results.filter((r) => !r.ok).map((r) => `✖ ${r.id}`).join(' ')}`);
}
console.error = realError;

// ── 4. Release gate (Topic 6) ────────────────────────────────────────────────
const gate = JSON.parse(fs.readFileSync('labs/06-ci-cd/quality-gate/gate.config.json', 'utf8'));
out('');
out('## 4. Release gate');
out('');
out(`Functional tests: max failed ${gate.tests.maxFailed}, max skipped ${gate.tests.maxSkipped ?? 'not limited'}, required ${gate.tests.required}`);
out(`LLM evals: min pass rate ${gate.llmEval.minPassRate}, required ${gate.llmEval.required} · red team: required ${gate.llmRedteam?.required}`);
out(`Performance: required ${gate.performance.required} · evidence freshness checked: ${gate.freshness ? 'yes' : 'no'}`);

// ── 5. Production dependencies (Topic 9) ─────────────────────────────────────
let prodVulns = '?';
try {
  prodVulns = Object.keys(JSON.parse(execFileSync('npm', ['audit', '--omit=dev', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })).vulnerabilities ?? {}).length;
} catch (err) {
  try {
    prodVulns = Object.keys(JSON.parse(err.stdout).vulnerabilities ?? {}).length;
  } catch {
    /* npm unavailable */
  }
}
out('');
out('## 5. Production dependencies');
out('');
out(`Known-vulnerable production packages today: ${prodVulns}`);

const md = `# Quality scorecard — Quality Books\n\n_Generated ${new Date().toISOString().slice(0, 10)} from this repository's evidence._\n\n${lines.map((l) => (l.startsWith('##') || !l ? l : `    ${l}`)).join('\n')}\n`;
fs.mkdirSync('test-results', { recursive: true });
fs.writeFileSync('test-results/scorecard.md', md);
console.log(lines.join('\n'));
console.log('\nWritten to test-results/scorecard.md');
