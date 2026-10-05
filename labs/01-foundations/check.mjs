// npm run learn:check 1 — Topic 1: QA Engineering Foundations.
import { pass, fail, node, nodeTest, read, notebook } from '../../scripts/learn-kit.mjs';

export const topic = { id: 1, title: 'QA Engineering Foundations' };

export const steps = [
  {
    id: '1',
    title: 'Map the quality attributes',
    run: () => notebook('01', 'quality-attributes.md'),
  },
  {
    id: '2',
    title: 'Explore with a charter and write a defect report',
    run: () => notebook('01', 'charter.md'),
  },
  {
    id: '3',
    title: 'Resolve the free-shipping inconsistency',
    run: () => {
      const t = nodeTest('labs/01-foundations/tests/*.test.js');
      if (t.fail) return fail(`${t.fail} test(s) failing`, 'npm run foundations:test and read the first failure');
      if (t.todo) return fail('the policy test is still a TODO', 'fix the policy text in app/src/catalog.js, then remove the { todo } option from the test');
      return pass(`${t.pass} oracle tests pass, no TODO left`);
    },
  },
  {
    id: '4',
    title: 'Close the risk gap and add a risk of your own',
    run: () => {
      const res = node(['labs/01-foundations/risks.mjs']);
      if (res.code) return fail('risks.mjs reports problems', 'npm run foundations:risks and fix what it lists');
      const { risks } = JSON.parse(read('labs/01-foundations/risk-register.json'));
      const r7 = risks.find((r) => r.id === 'R7');
      if (!r7?.checks.length) return fail('R7 has no checks yet', 'add your new policy test to R7 in risk-register.json');
      if (risks.length < 8) return fail(`${risks.length} risks in the register`, 'add at least one risk you found while exploring');
      return pass(`${risks.length} risks, every must-cover risk traced to a real check`);
    },
  },
  {
    id: '5',
    title: 'Hunt the planted bug and explain the results',
    run: () => {
      const res = node(['labs/01-foundations/bug-hunt.mjs']);
      if (res.code) return fail('the bug hunt did not pass', 'npm run foundations:bug-hunt and read its message');
      return notebook('01', 'bug-hunt.md');
    },
  },
];
