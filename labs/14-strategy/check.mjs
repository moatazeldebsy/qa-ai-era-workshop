// npm run learn:check 14 — Topic 14: Quality Strategy and Engineering Leadership.
import { pass, fail, nodeTest, notebook } from '../../scripts/learn-kit.mjs';

export const topic = { id: 14, title: 'Quality Strategy and Engineering Leadership' };

export const steps = [
  {
    id: '1-2',
    title: 'The scorecard runs, and every risk is traced to evidence that can detect it',
    run: () => {
      const t = nodeTest('labs/14-strategy/tests/*.test.js');
      if (t.fail) return fail(`${t.fail} strategy test(s) fail`, 'npm run strategy:test');
      if (t.todo) return fail('a risk is still traced to the wrong kind of evidence', 'link R6 to a check that measures time (lab step 2), then remove the TODO');
      return pass('scorecard built from live evidence; performance risks traced to timing evidence');
    },
  },
  {
    id: '3',
    title: 'A quality strategy grounded in the evidence',
    run: () => notebook('14', 'strategy.md'),
  },
  {
    id: '4',
    title: 'A one-page update for leadership',
    run: () => notebook('14', 'leadership-update.md'),
  },
];
