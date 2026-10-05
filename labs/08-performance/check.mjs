// npm run learn:check 8 — Topic 8: Performance, Load, and Resilience Testing.
import { spawn } from 'node:child_process';
import { pass, fail, sh, nodeTest, root, notebook } from '../../scripts/learn-kit.mjs';

export const topic = { id: 8, title: 'Performance, Load, and Resilience Testing' };

const P = 'labs/08-performance';

// Start the shop and inventory (test data on) on spare ports, run fn, stop them.
async function withServices(fn) {
  const env = { ...process.env, INVENTORY_TEST_DATA: 'on', LOG_REQUESTS: 'false', PORT: '3510', INVENTORY_PORT: '3520', INVENTORY_URL: 'http://127.0.0.1:3520' };
  const child = spawn(process.execPath, ['scripts/start-all.mjs'], { cwd: root, env, stdio: 'ignore', detached: true });
  try {
    for (let i = 0; i < 50; i++) {
      const up = await Promise.all(['http://127.0.0.1:3510/health', 'http://127.0.0.1:3520/health'].map((u) => fetch(u).then((r) => r.ok).catch(() => false)));
      if (up.every(Boolean)) break;
      await new Promise((r) => setTimeout(r, 200));
    }
    return await fn({ BASE_URL: 'http://127.0.0.1:3510', INVENTORY_URL: 'http://127.0.0.1:3520' });
  } finally {
    try {
      process.kill(-child.pid);
    } catch {
      child.kill();
    }
  }
}

export const steps = [
  {
    id: '2',
    title: 'The order load test sets up its own data and meets its thresholds',
    run: async () => {
      if (sh('k6', ['version']).code) return fail('k6 is not installed', 'brew install k6 · winget install k6 · see grafana.com/docs/k6/latest/set-up/install-k6');
      const res = await withServices((env) => sh('k6', ['run', '--quiet', `${P}/k6/orders.js`], { env }));
      if (res.code) {
        const failed = res.out.match(/http_req_failed[.\s:]+([\d.]+%)/)?.[1];
        return fail(`k6 thresholds crossed${failed ? ` (failed requests: ${failed})` : ''}`, 'give the test the stock it needs in setup(), through the test-data API (lab step 2)');
      }
      return pass('20 orders/s for 20 s: thresholds met');
    },
  },
  {
    id: '3-4',
    title: 'The shop fails fast on a slow dependency, and unknown URLs no longer leak metrics',
    run: () => {
      const a = nodeTest(`${P}/acceptance/resilience.acceptance.js`);
      if (a.fail) return fail(`${a.fail} of ${a.tests} resilience checks fail`, 'add a timeout to the inventory client; label metrics by route pattern (lab steps 3 and 4)');
      const t = nodeTest(`${P}/tests/*.test.js`);
      if (t.todo || t.fail) return fail('resilience.test.js still has a TODO or a failure', 'turn both TODOs into real tests');
      return pass('fast 503 when inventory is slow; bounded metric series');
    },
  },
  {
    id: '5',
    title: 'Notes: percentiles, load-test data, timeouts and the soak finding',
    run: () => notebook('08', 'perf-notes.md'),
  },
];
