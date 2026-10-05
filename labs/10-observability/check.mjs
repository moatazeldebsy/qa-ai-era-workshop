// npm run learn:check 10 — Topic 10: Production Quality and Observability.
import { pass, fail, nodeTest, notebook } from '../../scripts/learn-kit.mjs';

export const topic = { id: 10, title: 'Production Quality and Observability' };

const O = 'labs/10-observability';

export const steps = [
  {
    id: '2-4',
    title: 'Correlated logs, an honest readiness check, and a latency histogram',
    run: () => {
      const a = nodeTest(`${O}/acceptance/observability.acceptance.js`);
      if (a.fail) return fail(`${a.fail} of ${a.tests} observability acceptance checks fail`, 'forward the request id, add /ready, add the latency histogram (lab steps 2–4)');
      const t = nodeTest(`${O}/tests/*.test.js`);
      if (t.todo || t.fail) return fail('observability.test.js still has a TODO or a failure', 'turn the three TODOs into real tests');
      return pass('one request id across services; /ready follows the inventory service; latency SLI measurable');
    },
  },
  {
    id: '5',
    title: 'Notes: telemetry questions, correlation, health, SLOs and synthetic monitoring',
    run: () => notebook('10', 'observability-notes.md'),
  },
];
