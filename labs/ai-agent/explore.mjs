#!/usr/bin/env node
// Lab 9 - an AI agent explores the shop.
//
//   npm run agent -- free-shipping            # charter from labs/ai-agent/charters/
//   npm run agent -- assistant-safety --headed
//   npm run agent -- free-shipping --no-oracle   # same goal, no product rules
//
// Claude gets a goal (a test charter) and five tools that drive a real browser
// through Playwright. It decides what to do, reports what it finds, and the
// whole session is recorded as a Playwright trace you can replay:
//
//   npx playwright show-trace test-results/agent/trace.zip
//
// Needs ANTHROPIC_API_KEY (or another Anthropic credential). No key? Use the
// Playwright MCP server from Claude Code or Copilot instead - see the lab page.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createTools } from './tools.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const outDir = path.join(root, 'test-results', 'agent');
const baseURL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3210}`;
const model = process.env.AGENT_MODEL || 'claude-opus-5-5';

const args = process.argv.slice(2);
const charterName = args.find((a) => !a.startsWith('--')) || 'free-shipping';
const headed = args.includes('--headed');
const withOracle = !args.includes('--no-oracle');

const charterFile = path.join(here, 'charters', `${charterName}.md`);
if (!fs.existsSync(charterFile)) {
  const available = fs.readdirSync(path.join(here, 'charters')).map((f) => f.replace(/\.md$/, ''));
  console.error(`No charter "${charterName}". Available: ${available.join(', ')}`);
  process.exit(2);
}
if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
  console.error('Lab 9 needs ANTHROPIC_API_KEY. Without a key, use the Playwright MCP route on the lab page.');
  process.exit(2);
}
try {
  await fetch(`${baseURL}/health`);
} catch {
  console.error(`The shop isn't running at ${baseURL}. Start it with  npm start  (or npm run start:bug-cart).`);
  process.exit(2);
}

const charter = fs.readFileSync(charterFile, 'utf8');
// The oracle: what "correct" means. Without it the agent can only notice
// crashes and nonsense - it cannot know 4.90 EUR shipping on a 60 EUR cart is
// wrong. Running with --no-oracle shows the difference (Lab 9, step 4).
const oracle = withOracle ? fs.readFileSync(path.join(here, 'product-rules.md'), 'utf8') : '';

const { default: Anthropic } = await import('@anthropic-ai/sdk');
const { betaTool } = await import('@anthropic-ai/sdk/helpers/beta/json-schema');

fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: !headed, slowMo: headed ? 300 : 0 });
const context = await browser.newContext({ baseURL });
await context.tracing.start({ screenshots: true, snapshots: true });
const page = await context.newPage();

const findings = [];
const actions = [];
const log = (line) => {
  actions.push(line);
  console.log(`  · ${line}`);
};

const tools = createTools({ page, defineTool: betaTool, log, findings });

const system = `You are an experienced exploratory tester. You test the "Quality Books" web shop through a real browser, using only the tools you are given.

How to work:
- Start with open_page("/") and page_snapshot. Look before you act; snapshot again after each action to check what changed.
- Follow the charter. Try the obvious path first, then variations and edge cases.
- When something is wrong, reproduce it once more, then call report_finding with exact steps and observed values.
- Do not report something as a bug unless you can say what the correct behaviour is${withOracle ? ' (quote the product rule)' : ''}.
- You have a limited number of actions. When the charter is covered, stop and write a short test report: what you covered, what you found, what you did not get to.
${withOracle ? `\nPRODUCT RULES (the oracle):\n${oracle}` : ''}`;

console.log(`\nLab 9 · charter "${charterName}" · ${model} · oracle ${withOracle ? 'on' : 'OFF'} · ${baseURL}\n`);

const client = new Anthropic();
let finalMessage;
try {
  finalMessage = await client.beta.messages.toolRunner({
    model,
    max_tokens: 16000,
    max_iterations: Number(process.env.AGENT_MAX_STEPS) || 30,
    output_config: { effort: 'medium' },
    // Server-side refusal fallback, on by default for this model family.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system,
    tools,
    messages: [{ role: 'user', content: `CHARTER:\n${charter}` }],
  });
} finally {
  await context.tracing.stop({ path: path.join(outDir, 'trace.zip') });
  await browser.close();
}

const report = (finalMessage?.content ?? []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
const result = { charter: charterName, model, oracle: withOracle, baseURL, actions, findings, report };
fs.writeFileSync(path.join(outDir, `${charterName}.json`), JSON.stringify(result, null, 2));

console.log('\n── Agent report ' + '─'.repeat(50));
console.log(report || '(no report - the agent ran out of steps; raise AGENT_MAX_STEPS)');
console.log('─'.repeat(66));
console.log(`${actions.length} actions · ${findings.length} finding(s)`);
for (const f of findings) console.log(`  [${f.severity}] ${f.title}\n      rule: ${f.rule}`);
console.log(`\nFindings: test-results/agent/${charterName}.json`);
console.log('Replay:   npx playwright show-trace test-results/agent/trace.zip\n');
