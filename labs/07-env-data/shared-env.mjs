#!/usr/bin/env node
// npm run data:shared — run the shared-environment tests the way a team
// would against one staging environment: ONE inventory service, every test
// file in parallel, several times in a row. Prints how many runs passed.
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createInventoryApp } from '../../services/inventory/src/app.js';

const runs = Number(process.env.RUNS) || 10;
const concurrency = Number(process.env.CONCURRENCY) || 4; // CONCURRENCY=1 runs the files one at a time
const app = createInventoryApp({ allowTestData: true });
const server = await new Promise((resolve) => {
  const s = app.listen(0, '127.0.0.1', () => resolve(s));
});
const url = `http://127.0.0.1:${server.address().port}`;
console.log(`One shared inventory service at ${url}; ${runs} runs, ${concurrency === 1 ? 'test files one at a time' : `up to ${concurrency} test files at once`}.\n`);

let green = 0;
for (let i = 1; i <= runs; i++) {
  // Async, not spawnSync: the shared service runs in THIS process and must
  // keep answering while the tests run.
  const res = await new Promise((resolve) => {
    const child = spawn(process.execPath, ['--test', `--test-concurrency=${concurrency}`, '--test-reporter=tap', path.join('labs/07-env-data/shared', '*.test.js')], {
      env: { ...process.env, INVENTORY_URL: url },
    });
    let stdout = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.on('close', (status) => resolve({ status, stdout }));
  });
  const failed = [...res.stdout.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1]).filter((n) => !n.endsWith('.test.js'));
  if (res.status === 0) green += 1;
  console.log(`run ${String(i).padStart(2)}  ${res.status === 0 ? '✔ green' : `✖ red: ${failed.join('; ') || 'see output'}`}`);
}
server.close();
console.log(`\n${green}/${runs} runs green.`);
process.exit(green === runs ? 0 : 1);
