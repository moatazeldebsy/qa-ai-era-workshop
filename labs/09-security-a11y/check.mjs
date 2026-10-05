// npm run learn:check 9 — Topic 9: Security, Accessibility, and Compatibility Testing.
import path from 'node:path';
import { pass, fail, sh, nodeTest, read, root, notebook } from '../../scripts/learn-kit.mjs';

export const topic = { id: 9, title: 'Security, Accessibility, and Compatibility Testing' };

const L = 'labs/09-security-a11y';
const playwright = (args) => sh(path.join(root, 'node_modules/.bin/playwright'), ['test', '--reporter=line', ...args]);
const summary = (out) => out.match(/\d+ (passed|failed)[^\n]*/g)?.join(', ') ?? 'no result';

export const steps = [
  {
    id: '2-3',
    title: 'Hardened HTTP responses, and an internal API that requires a service token',
    run: () => {
      const a = nodeTest(`${L}/acceptance/security.acceptance.js`);
      if (a.fail) return fail(`${a.fail} of ${a.tests} security acceptance checks fail`, 'add the security headers to the shop; require a token on the inventory service and send it from the client (lab steps 2 and 3)');
      const t = nodeTest(`${L}/tests/*.test.js`);
      if (t.todo || t.fail) return fail('security.test.js still has a TODO or a failure', 'turn both TODOs into real tests');
      return pass('headers on every response; inventory refuses callers without the token');
    },
  },
  {
    id: '4',
    title: 'Buttons say what they show, and the cart announces its total',
    run: () => {
      if (/^\s*test\.fail\(/m.test(read(`${L}/a11y/a11y.spec.js`))) return fail('a11y.spec.js still marks a known problem with test.fail()', 'fix the front end, then delete the test.fail lines');
      const own = playwright(['--project=a11y']);
      if (own.code) return fail(`a11y.spec.js: ${summary(own.out)}`, 'npm run a11y:test');
      const acc = playwright(['--project=a11y-acceptance']);
      if (acc.code) return fail(`your fixes pass a11y.spec.js but not the acceptance checks: ${summary(acc.out)}`, 'check the out-of-stock button and the page after a search, not only the start page');
      const e2e = playwright(['--project=e2e']);
      if (e2e.code) return fail(`the Topic 5 browser tests now fail: ${summary(e2e.out)}`, 'npm run test:e2e: a locator may depend on the old button names');
      return pass('accessible names match labels; totals in a live region; browser suite still green');
    },
  },
  {
    id: '5',
    title: 'Notes: dependency triage, headers, the abuse case, accessibility and compatibility',
    run: () => notebook('09', 'security-a11y-notes.md'),
  },
];
