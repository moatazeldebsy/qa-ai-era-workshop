// npm run learn:check 4 — Topic 4: Integration, API, and Contract Testing.
import { pass, fail, node, nodeTest, read, notebook } from '../../scripts/learn-kit.mjs';

export const topic = { id: 4, title: 'Integration, API, and Contract Testing' };

const L = 'labs/04-integration-contract';

export const steps = [
  {
    id: '1',
    title: 'Client mistakes get 4xx answers, never 500',
    run: () => {
      const a = nodeTest(`${L}/acceptance/errors.acceptance.js`);
      if (a.fail) return fail(`${a.fail} of ${a.tests} error-handling checks fail`, "let the error handler keep Express's 4xx status (err.status) instead of answering 500");
      const t = nodeTest(`${L}/tests/api.test.js`);
      if (t.todo || t.fail) return fail('api.test.js still has a TODO or a failure', 'turn the 4xx TODO into a real test');
      return pass('malformed and oversized bodies answered 400 and 413 on every JSON route');
    },
  },
  {
    id: '2-3',
    title: 'The contract is honoured and the integration bug is fixed',
    run: () => {
      const consumer = nodeTest(`${L}/tests/inventory.consumer.test.js`);
      if (consumer.fail) return fail('the consumer contract tests fail', 'node --test labs/04-integration-contract/tests/inventory.consumer.test.js');
      const t = nodeTest(`${L}/tests/integration.test.js`);
      if (t.fail) return fail(`${t.fail} integration test(s) failing`, 'node --test labs/04-integration-contract/tests/integration.test.js');
      if (t.todo) return fail('the cancel-and-restock finding is still a TODO', 'turn it into a real test once the stock comes back');
      const verify = node([`${L}/verify-provider.mjs`]);
      if (verify.code) return fail("the inventory service doesn't honour the shop's contract", 'npm run contract:verify and read the mismatch');
      const a = nodeTest(`${L}/acceptance/integration.acceptance.js`);
      if (a.fail) return fail('the shop and the real inventory service still disagree', 'cancel an order and check the stock in the inventory service');
      if (!read(`${L}/pacts/quality-books-shop-inventory-service.json`).includes('reservationId')) {
        return fail("the contract doesn't mention reservationId", 'update the consumer test to expect what the provider publishes');
      }
      return pass('consumer tests, provider verification and the real integration all agree');
    },
  },
  {
    id: '4',
    title: 'Notes: the contract, the bug, and the breaking-change drill',
    run: () => notebook('04', 'contract-notes.md'),
  },
];
