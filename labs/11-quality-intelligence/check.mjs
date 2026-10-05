// npm run learn:check 11 — Topic 11: Test Management and Quality Intelligence.
import { pass, fail, nodeTest, notebook } from '../../scripts/learn-kit.mjs';

export const topic = { id: 11, title: 'Test Management and Quality Intelligence' };

const Q = 'labs/11-quality-intelligence';

export const steps = [
  {
    id: '2-3',
    title: 'The analysis sees flakiness across runs and behind retries',
    run: () => {
      const a = nodeTest(`${Q}/acceptance/analyze.acceptance.js`);
      if (a.fail) return fail(`${a.fail} of ${a.tests} analysis acceptance checks fail`, 'judge flakiness from the whole history, and read Playwright JSON for retried passes (lab steps 2 and 3)');
      const t = nodeTest(`${Q}/tests/*.test.js`);
      if (t.todo || t.fail) return fail('analyze.test.js still has a TODO or a failure', 'turn both TODOs into real tests');
      return pass('flaky ≠ failing; failure rates from history; retried passes counted');
    },
  },
  {
    id: '4',
    title: 'Notes: metrics and what they hide, flakiness, retries and decisions',
    run: () => notebook('11', 'qi-notes.md'),
  },
];
