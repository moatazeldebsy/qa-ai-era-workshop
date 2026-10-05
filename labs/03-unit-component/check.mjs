// npm run learn:check 3 — Topic 3: Unit and Component Testing.
import fs from 'node:fs';
import path from 'node:path';
import { pass, fail, nodeTest, exists, notebook, root, sh } from '../../scripts/learn-kit.mjs';

export const topic = { id: 3, title: 'Unit and Component Testing' };

const T = 'labs/03-unit-component';
const acceptance = (file) => nodeTest(`${T}/acceptance/${file}`);

export const steps = [
  {
    id: '1',
    title: 'Name the smells and rewrite two tests cleanly',
    run: () => {
      if (!exists(`${T}/tests/clean.test.js`)) return fail(`${T}/tests/clean.test.js does not exist`, 'rewrite two smelly tests there (lab step 1)');
      const t = nodeTest(`${T}/tests/clean.test.js`);
      if (t.fail || !(t.pass >= 2)) return fail(`clean.test.js: ${t.pass || 0} passing, ${t.fail || 0} failing`, 'it needs at least two passing tests');
      return notebook('03', 'unit-notes.md');
    },
  },
  {
    id: '2',
    title: 'Refund window counts calendar days in Berlin',
    run: () => {
      const a = acceptance('returns.acceptance.js');
      if (a.fail) return fail(`${a.fail} of ${a.tests} acceptance cases fail`, 'compare calendar dates in SHOP_TIME_ZONE, not 24-hour periods (lab step 2)');
      const t = nodeTest(`${T}/tests/returns.test.js`);
      if (t.todo || t.fail) return fail('returns.test.js still has a TODO or a failure', 'turn the midnight TODO into a real test');
      return pass(`all ${a.tests} calendar cases pass, including both clock changes`);
    },
  },
  {
    id: '3a',
    title: 'Checkout cleans up after a declined payment and survives a failed email',
    run: () => {
      const a = acceptance('checkout.acceptance.js');
      if (a.fail) return fail(`${a.fail} of ${a.tests} checkout acceptance checks fail`, 'release the reservation on a declined payment; record confirmationSent (lab step 3)');
      const t = nodeTest(`${T}/tests/checkout.test.js`);
      if (t.todo || t.fail) return fail('checkout.test.js still has a TODO or a failure', 'turn the reservation TODO into a real test, and add one for the failing mailer');
      return pass('reservation released; a paid order survives a mailer outage');
    },
  },
  {
    id: '3b',
    title: 'The interaction test notices a wrong charge',
    run: () => {
      const file = `${T}/tests/interactions.test.js`;
      const clean = nodeTest(file);
      if (clean.fail) return fail('interactions.test.js fails on correct code', 'run it and fix the assertion');
      const buggy = nodeTest(file, { env: { BUG_MODE: 'cart' } });
      if (!buggy.fail) return fail('still green with BUG_MODE=cart, which charges the wrong amount', 'assert WHAT was charged, not just that charge() was called');
      return pass('green on correct code, red on BUG_MODE=cart');
    },
  },
  {
    id: '4',
    title: 'Coupons, built test-first',
    run: () => {
      const mine = nodeTest(`${T}/tests/coupons.test.js`);
      if (mine.todo || mine.fail || !(mine.pass >= 8)) {
        return fail(`your coupon tests: ${mine.pass || 0} pass, ${mine.fail || 0} fail, ${mine.todo || 0} todo`, 'aim for at least 8 passing tests, no TODO left');
      }
      const a = acceptance('coupons.acceptance.js');
      if (a.fail) return fail(`your tests pass, but ${a.fail} of ${a.tests} acceptance checks fail`, 'reread the rules: which one did your tests not pin down?');
      return pass(`${mine.pass} tests of your own; all acceptance checks pass`);
    },
  },
  {
    id: '5',
    title: 'Mutation score of at least 90% on checkout and returns',
    run: () => {
      const res = sh(path.join(root, 'node_modules/.bin/stryker'), ['run', `${T}/stryker.config.json`, '--reporters', 'json']);
      const report = path.join(root, 'reports/mutation/topic-03.json');
      if (res.code || !fs.existsSync(report)) return fail('Stryker did not finish', 'npm run unit:mutate and read its output');
      const mutants = Object.values(JSON.parse(fs.readFileSync(report, 'utf8')).files).flatMap((f) => f.mutants);
      const detected = mutants.filter((m) => ['Killed', 'Timeout'].includes(m.status)).length;
      const valid = mutants.filter((m) => ['Killed', 'Timeout', 'Survived', 'NoCoverage'].includes(m.status)).length;
      const score = Math.round((detected / valid) * 1000) / 10;
      if (score < 90) return fail(`mutation score ${score}% (${valid - detected} survivors)`, 'open reports/mutation/topic-03.html and write tests that kill the survivors that matter');
      return pass(`mutation score ${score}%`);
    },
  },
];

