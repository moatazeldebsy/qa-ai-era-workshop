import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import express from 'express';
import { checkService } from '../../../platform/conformance.mjs';
import { useBaseline, useErrorHandling } from '../../../platform/express-baseline.mjs';
import { createInventoryApp } from '../../../services/inventory/src/app.js';

process.env.LOG_REQUESTS = 'false';
process.env.NODE_ENV = 'test';
const serve = async (app) => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) };
};

test('the baseline turns errors into safe JSON: 500 hides details, a 4xx says what was wrong', async () => {
  const app = express();
  useBaseline(app, { service: 'acceptance', csp: "default-src 'self'" });
  app.get('/boom', () => {
    throw new Error('database password is hunter2');
  });
  app.get('/invalid', () => {
    throw Object.assign(new Error('quantity must be positive'), { status: 422, expose: true });
  });
  useErrorHandling(app);
  const { url, close } = await serve(app);
  try {
    const boom = await fetch(`${url}/boom`);
    assert.equal(boom.status, 500);
    assert.doesNotMatch(await boom.text(), /hunter2|at \w+ \(/);
    const invalid = await fetch(`${url}/invalid`);
    assert.equal(invalid.status, 422);
    assert.equal((await invalid.json()).error, 'quantity must be positive');
    assert.equal((await fetch(`${url}/invalid`)).headers.get('content-security-policy'), "default-src 'self'", 'a service can choose its own policy');
  } finally {
    await close();
  }
  const plain = express();
  useBaseline(plain);
  plain.get('/health', (_req, res) => res.json({ status: 'ok' }));
  useErrorHandling(plain);
  assert.deepEqual((await checkService(plain)).filter((r) => !r.ok), []);
});

test('the inventory service is on the paved road', async () => {
  const results = await checkService(createInventoryApp());
  assert.deepEqual(results.filter((r) => !r.ok).map((r) => `${r.id}: ${r.problem}`), []);
});

test('the scaffolder validates names, and what it creates passes its own tests', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'platform-acc-'));
  try {
    fs.mkdirSync(path.join(root, 'services', 'existing'), { recursive: true });
    for (const bad of ['..', '../../tmp-escape', 'a/b', 'UPPER', 'existing', '-dash', 'no--double']) {
      const res = spawnSync(process.execPath, ['platform/new-service.mjs', '--root', root, bad], { encoding: 'utf8' });
      assert.notEqual(res.status, 0, `accepted "${bad}"`);
    }
    assert.equal(fs.readdirSync(root).sort().join(','), 'services', 'something was written outside services/');
    // A real service in the temporary repository: it needs the platform and the dependencies.
    fs.symlinkSync(path.resolve('platform'), path.join(root, 'platform'), 'dir');
    fs.symlinkSync(path.resolve('node_modules'), path.join(root, 'node_modules'), 'dir');
    fs.copyFileSync('package.json', path.join(root, 'package.json'));
    const made = spawnSync(process.execPath, ['platform/new-service.mjs', '--root', root, 'gift-cards'], { encoding: 'utf8' });
    assert.equal(made.status, 0, made.stderr);
    const run = spawnSync(process.execPath, ['--test', '--test-reporter=tap', 'services/gift-cards/tests/*.test.js'], { cwd: root, encoding: 'utf8', env: { ...process.env, NODE_ENV: 'test' } });
    assert.equal(run.status, 0, run.stdout.split('\n').filter((l) => /not ok|#/.test(l)).join('\n'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
