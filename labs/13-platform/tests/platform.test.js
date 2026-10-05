import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import express from 'express';
import { checkService } from '../../../platform/conformance.mjs';
import { useBaseline, useErrorHandling } from '../../../platform/express-baseline.mjs';
import { createInventoryApp } from '../../../services/inventory/src/app.js';

// Learning Path, Topic 13 — the platform's own code is software too: the
// conformance kit, the baseline library and the scaffolder all get tests.

process.env.LOG_REQUESTS = 'false';
process.env.NODE_ENV = 'test';
const failing = (results) => results.filter((r) => !r.ok).map((r) => `${r.id}: ${r.problem}`);

describe('the conformance kit', () => {
  test('flags a bare Express app on every standard', async () => {
    const results = await checkService(express());
    assert.deepEqual(results.filter((r) => r.ok).map((r) => r.id), []);
  });
});

describe('the paved road', () => {
  test(
    'an app built on the platform baseline meets every standard',
    { todo: 'the baseline library is a stub; Topic 13 lab, step 2' },
    async () => {
      const app = express();
      useBaseline(app, { service: 'example' });
      app.use(express.json());
      app.get('/health', (_req, res) => res.json({ status: 'ok' }));
      useErrorHandling(app);
      assert.deepEqual(failing(await checkService(app)), []);
    },
  );

  // Found by the first fleet report: 0 of 2 services met every standard.
  test(
    'the inventory service meets every standard',
    { todo: 'real gap: no request id, no security headers, HTML errors; Topic 13 lab, step 3' },
    async () => {
      assert.deepEqual(failing(await checkService(createInventoryApp())), []);
    },
  );
});

describe('the scaffolder', () => {
  const scaffold = (root, name) => spawnSync(process.execPath, ['platform/new-service.mjs', '--root', root, name], { encoding: 'utf8' });
  const tempRoot = () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'platform-'));
    fs.mkdirSync(path.join(root, 'services', 'inventory'), { recursive: true });
    fs.writeFileSync(path.join(root, 'services', 'inventory', 'KEEP'), 'existing service');
    return root;
  };

  test('a new service gets its source, its tests and a CI workflow', () => {
    const root = tempRoot();
    const res = scaffold(root, 'recommendations');
    assert.equal(res.status, 0, res.stderr);
    for (const f of ['services/recommendations/src/app.js', 'services/recommendations/tests/conformance.test.js', '.github/workflows/service-recommendations.yml']) {
      assert.ok(fs.existsSync(path.join(root, f)), `${f} missing`);
    }
    assert.match(fs.readFileSync(path.join(root, 'services/recommendations/src/app.js'), 'utf8'), /createRecommendationsApp/);
    fs.rmSync(root, { recursive: true, force: true });
  });

  // Found by asking "what if someone types something odd?" Internal tools
  // run with the developer's permissions on the whole repository.
  test(
    'it refuses names that escape services/, replace a service, or aren\'t valid',
    { todo: 'real bug: no validation of the service name; Topic 13 lab, step 4' },
    () => {
      const root = tempRoot();
      for (const name of ['../escape', 'inventory', 'Bad Name', 'x']) {
        assert.notEqual(scaffold(root, name).status, 0, `accepted "${name}"`);
      }
      assert.equal(fs.existsSync(path.join(root, 'escape')), false, 'wrote outside services/');
      assert.equal(fs.readFileSync(path.join(root, 'services/inventory/KEEP'), 'utf8'), 'existing service', 'an existing service was changed');
      fs.rmSync(root, { recursive: true, force: true });
    },
  );
});
