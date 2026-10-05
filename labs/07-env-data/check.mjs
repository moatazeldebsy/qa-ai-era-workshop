// npm run learn:check 7 — Topic 7: Test Environments and Test Data Management.
import fs from 'node:fs';
import path from 'node:path';
import { pass, fail, node, nodeTest, read, root, notebook } from '../../scripts/learn-kit.mjs';

export const topic = { id: 7, title: 'Test Environments and Test Data Management' };

const D = 'labs/07-env-data';

export const steps = [
  {
    id: '2',
    title: 'Shared-environment tests own their data and pass in parallel',
    run: () => {
      const sources = fs.readdirSync(path.join(root, D, 'shared')).filter((f) => f.endsWith('.test.js')).map((f) => read(`${D}/shared/${f}`)).join('\n');
      if (/\b(stock|reserve)\(\s*5\s*[,)]/.test(sources)) return fail('a test still depends on the seeded stock of book 5', 'give each test its own book through the test-data API (lab step 2)');
      const res = node([`${D}/shared-env.mjs`], { env: { RUNS: '5' } });
      if (res.code) return fail(res.out.trim().split('\n').at(-1), 'npm run data:shared');
      return pass('5/5 parallel runs green against one shared service');
    },
  },
  {
    id: '3',
    title: 'Realistic, reproducible data: the report counts only kept money',
    run: () => {
      const a = nodeTest(`${D}/acceptance/data.acceptance.js`);
      if (a.fail) return fail(`${a.fail} of ${a.tests} data acceptance checks fail`, 'seed the generator, and make every figure in salesReport leave out cancelled and refunded orders');
      const t = nodeTest(`${D}/tests/*.test.js`);
      if (t.todo || t.fail) return fail('a Topic 7 test still has a TODO or a failure', 'npm run data:test');
      return pass('seeded generator; revenue, averages and book totals only count kept orders');
    },
  },
  {
    id: '4',
    title: 'The masked export is safe and still useful',
    run: () => {
      const mask = (key) => {
        const res = node([`${D}/mask.mjs`], { env: { MASK_KEY: key } });
        if (res.code) return null;
        return read(`${D}/masked/customers.csv`) + read(`${D}/masked/orders.csv`);
      };
      const a1 = mask('check-key-a');
      if (a1 === null) return fail('mask.mjs fails', 'MASK_KEY=… npm run data:mask');
      const a2 = mask('check-key-a');
      const b = mask('check-key-b');
      if (a1 !== a2) return fail('masking the same export twice with the same key gives different results', 'pseudonyms must be deterministic for a given key');
      if (a1 === b) return fail('a different MASK_KEY gives the same pseudonyms', 'derive pseudonyms from the key (HMAC), not from the email alone');
      const scan = node([`${D}/pii-scan.mjs`]);
      if (scan.code) return fail(scan.out.trim().split('\n').slice(1).join(' ').replace(/\s+/g, ' ').trim(), 'npm run data:scan');
      return pass('no personal values, keyed pseudonyms, every order still joins');
    },
  },
  {
    id: '5',
    title: 'Notes: environments, shared data, realistic data and masking',
    run: () => notebook('07', 'data-notes.md'),
  },
];
