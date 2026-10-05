// npm run learn:check 13 — Topic 13: QA Platform Engineering and Test Infrastructure.
import { pass, fail, nodeTest, notebook } from '../../scripts/learn-kit.mjs';

export const topic = { id: 13, title: 'QA Platform Engineering and Test Infrastructure' };

const P = 'labs/13-platform';

export const steps = [
  {
    id: '2-4',
    title: 'A working baseline, the inventory service on the paved road, and a safe scaffolder',
    run: () => {
      const a = nodeTest(`${P}/acceptance/platform.acceptance.js`, { env: { NODE_ENV: 'test' } });
      if (a.fail) return fail(`${a.fail} of ${a.tests} platform acceptance checks fail`, 'implement the baseline, adopt it in the inventory service, validate service names (lab steps 2–4)');
      const t = nodeTest(`${P}/tests/*.test.js`);
      if (t.todo || t.fail) return fail('platform.test.js still has a TODO or a failure', 'turn the three TODOs into real tests');
      return pass('baseline meets every standard; inventory conforms; scaffolder refuses bad names and its services pass their tests');
    },
  },
  {
    id: '5',
    title: 'Notes: the fleet, the paved road, adoption and internal tooling',
    run: () => notebook('13', 'platform-notes.md'),
  },
];
