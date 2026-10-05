// npm run learn:check 5 — Topic 5: UI, Web, and End-to-End Testing.
import path from 'node:path';
import { pass, fail, sh, exists, read, root, notebook } from '../../scripts/learn-kit.mjs';

export const topic = { id: 5, title: 'UI, Web, and End-to-End Testing' };

const E = 'labs/05-ui-e2e';
const playwright = (args, env) => sh(path.join(root, 'node_modules/.bin/playwright'), ['test', '--reporter=line', ...args], { env });
const summary = (out) => out.match(/\d+ (passed|failed)[^\n]*/g)?.join(', ') ?? 'no result';

export const steps = [
  {
    id: '1',
    title: 'Brittle tests rewritten with resilient locators and web-first assertions',
    run: () => {
      const file = `${E}/e2e/tests/refactored.spec.js`;
      if (!exists(file)) return fail(`${file} does not exist`, 'rewrite the two brittle tests there (lab step 1)');
      const smells = [
        [/waitForTimeout/, 'a fixed sleep (waitForTimeout)'],
        [/nth-child|nth-of-type/, 'a position-based CSS selector'],
        [/\$eval|\$\$eval|allTextContents\(\)\s*;?\s*\n\s*expect\(\w+\.length/, 'a one-shot read instead of a web-first assertion'],
        [/localhost:\d+/, 'a hard-coded URL (use baseURL: page.goto("/"))'],
      ];
      const source = read(file);
      const found = smells.filter(([re]) => re.test(source)).map(([, what]) => what);
      if (found.length) return fail(`refactored.spec.js still uses ${found.join(', ')}`, 'see section 4.2 and 4.3 of the Concepts');
      const res = playwright(['--project=e2e', file]);
      if (res.code) return fail(`refactored.spec.js fails: ${summary(res.out)}`, `npx playwright test --project=e2e ${file}`);
      return pass(summary(res.out));
    },
  },
  {
    id: '2-3',
    title: 'The stuck cart and the stale-price race are fixed',
    run: () => {
      if (/^\s*test\.fail\(/m.test(read(`${E}/e2e/tests/journeys.spec.js`))) {
        return fail('journeys.spec.js still marks a known bug with test.fail()', 'fix app/public/app.js, then delete the test.fail lines');
      }
      const journeys = playwright(['--project=e2e', `${E}/e2e/tests/journeys.spec.js`]);
      if (journeys.code) return fail(`journeys.spec.js: ${summary(journeys.out)}`, 'npx playwright test --project=e2e labs/05-ui-e2e/e2e/tests/journeys.spec.js');
      const acceptance = playwright(['--project=ui-acceptance']);
      if (acceptance.code) return fail(`your fixes pass the journeys, but the acceptance checks don't: ${summary(acceptance.out)}`, 'try other books and three quick adds, not just the cases in journeys.spec.js');
      return pass('journeys and acceptance checks pass');
    },
  },
  {
    id: '4',
    title: 'The recommendations test is no longer flaky, even on a slow server',
    run: () => {
      const bad = read(`${E}/flaky/tests/recommendations.bad.spec.js`);
      if (/waitForTimeout/.test(bad)) return fail('recommendations.bad.spec.js still sleeps a fixed time', 'replace the sleep and the one-shot count with a web-first assertion');
      const res = playwright(['--project=flaky', '--repeat-each=3'], { RECOMMENDATIONS_DELAY_MS: '1200' });
      if (res.code) return fail(`with a 1.2 s server: ${summary(res.out)}`, 'RECOMMENDATIONS_DELAY_MS=1200 npx playwright test --project=flaky');
      return pass(`passes every run with a 1.2 s server (${summary(res.out)})`);
    },
  },
  {
    id: '5',
    title: 'Notes: brittleness, the journey bugs, flakiness and the browser matrix',
    run: () => notebook('05', 'ui-notes.md'),
  },
];
