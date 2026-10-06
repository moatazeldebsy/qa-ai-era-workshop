// npm run learn:check 2 — Topic 2: Test Design Techniques.
import { pass, fail, node, nodeTest, read, notebook } from '../../scripts/learn-kit.mjs';

export const topic = { id: 2, title: 'Test Design Techniques' };

export const steps = [
  {
    id: '1-3',
    title: 'Design notes: partitions, the missing routing column, the state table',
    run: () => notebook('02', 'design-notes.md'),
  },
  {
    id: '4a',
    title: 'The same book on two lines is rejected',
    run: () => {
      // A fresh process, so the learner's latest cart.js is the one imported.
      const probe = `import('./app/src/cart.js').then((m) => {
        try { m.priceCart([{ bookId: 5, quantity: 2 }, { bookId: 5, quantity: 2 }]); console.log('ACCEPTED'); }
        catch (e) { console.log(e instanceof m.ValidationError ? 'REJECTED ' + e.message : 'CRASHED ' + e.message); }
      })`;
      const out = node(['-e', probe]).out.trim();
      if (out.startsWith('REJECTED')) return pass(out.replace('REJECTED ', 'rejected: '));
      if (out.startsWith('ACCEPTED')) return fail('2 + 2 copies of book 5 (stock 3) are still accepted', 'fix priceCart in app/src/cart.js (lab step 4.3)');
      return fail(out, 'duplicates must throw a ValidationError, not another error');
    },
  },
  {
    id: '4b',
    title: 'The API contract states the one-line-per-book rule',
    run: () =>
      /one line/i.test(read('app/openapi.yaml'))
        ? pass('app/openapi.yaml updated')
        : fail('app/openapi.yaml does not mention the rule', 'add "Each book may appear on only one line." to the /api/cart/price description'),
  },
  {
    id: '4c',
    title: 'Both duplicate-line TODOs are real tests, and nothing else broke',
    run: () => {
      const t = nodeTest('labs/02-test-design/tests/*.test.js');
      if (t.fail) return fail(`${t.fail} test(s) failing`, 'npm run design:test and read the first failure');
      if (/# TODO (real bug|finds the duplicate)/.test(t.out)) return fail('a duplicate-line test is still a TODO', 'delete the { todo: … } line from both tests');
      for (const [name, glob] of [['app unit tests', 'app/test/*.test.js'], ['Topic 1 tests', 'labs/01-foundations/tests/*.test.js']]) {
        if (nodeTest(glob).fail) return fail(`your change broke the ${name}`, `node --test "${glob}"`);
      }
      return pass(`${t.pass} design tests pass`);
    },
  },
  {
    id: '6',
    title: 'Mutation scorecard: every mutant killed',
    // Before the duplicate-line fix, the property-based score is stuck at 2/10.
    after: ['4a'],
    run: () => {
      const res = node(['labs/02-test-design/mutants.mjs']);
      if (res.code) return fail('a mutant survived, or the clean run failed', 'npm run design:mutants and read the last lines');
      const props = res.out.match(/Killed by this technique.*?(\d+)\/\d+\s*$/m)?.[1];
      if (Number(props) < 3) return fail(`property-based kills ${props}/10; expected 3 once the stock property is a real test`, 'finish step 4 first');
      return pass(`all mutants killed; property-based ${props}/10`);
    },
  },
];
