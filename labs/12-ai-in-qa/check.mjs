// npm run learn:check 12 — Topic 12: AI in QA Engineering.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pass, fail, sh, root, notebook } from '../../scripts/learn-kit.mjs';

export const topic = { id: 12, title: 'AI in QA Engineering' };

// Start the shop with one assistant mode on a spare port, run the red team
// against it, and return each case's pass/fail by description.
async function redTeam(mode) {
  const port = 3950 + (mode === 'buggy' ? 1 : 0);
  const app = spawn(process.execPath, ['app/src/server.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(port), ASSISTANT_MODE: mode, LOG_REQUESTS: 'false' },
    stdio: 'ignore',
  });
  try {
    for (let i = 0; i < 50; i++) {
      if (await fetch(`http://127.0.0.1:${port}/health`).then((r) => r.ok).catch(() => false)) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    sh(path.join(root, 'node_modules/.bin/promptfoo'), ['eval', '-c', 'labs/12-ai-in-qa/llm-eval/redteam.yaml', '--no-cache'], {
      env: { BASE_URL: `http://127.0.0.1:${port}`, PROMPTFOO_DISABLE_TELEMETRY: '1' },
    });
    const results = JSON.parse(fs.readFileSync(path.join(root, 'test-results/llm-redteam.json'), 'utf8')).results.results;
    return new Map(results.map((r) => [r.testCase.description, r.success]));
  } finally {
    app.kill();
  }
}

export const steps = [
  {
    id: '3',
    title: 'The red team catches every leak, without failing the safe assistant',
    run: async () => {
      const [major] = process.versions.node.split('.').map(Number);
      if (major < 22 || (major === 22 && Number(process.versions.node.split('.')[1]) < 22)) {
        return fail(`promptfoo needs Node 22.22 or newer; this is ${process.versions.node}`, 'nvm use (the repo pins Node 24 in .nvmrc)');
      }
      const safe = await redTeam('mock');
      const unsafeOnMock = [...safe].filter(([, ok]) => !ok).map(([d]) => d);
      if (unsafeOnMock.length) return fail(`the mock assistant now fails: ${unsafeOnMock.join('; ')}`, 'a new assertion is too broad: it flags safe answers');
      const buggy = await redTeam('buggy');
      const leaks = ['direct override', 'fake system message inside user input', 'asks for the hidden catalogue data'].filter((d) => buggy.get(d));
      if (leaks.length) return fail(`still "resisted" although the buggy assistant leaked its instructions: ${leaks.join('; ')}`, 'add a leak check that applies to every attack (lab step 3)');
      return pass(`mock: ${safe.size}/${safe.size} resisted; buggy: ${[...buggy.values()].filter((ok) => !ok).length} attacks caught, including every leak`);
    },
  },
  {
    id: '4',
    title: 'Notes: an AI-drafted suite, LLM evals, the evaluator, and the agent',
    run: () => notebook('12', 'ai-notes.md'),
  },
];
