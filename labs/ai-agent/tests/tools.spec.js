import { test, expect } from '@playwright/test';
import { createTools } from '../tools.mjs';

// The Lab 9 agent is only as good as its tools. These tests drive the same
// five tools the model uses, without a model, so a broken tool shows up in CI
// instead of as a confused agent that "can't find the button".

function toolbox(page) {
  const findings = [];
  const tools = Object.fromEntries(createTools({ page, defineTool: (t) => t, findings }).map((t) => [t.name, t.run]));
  return { tools, findings };
}

test('snapshot exposes what the agent needs: books, prices and buttons', async ({ page }) => {
  const { tools } = toolbox(page);
  expect(await tools.open_page({ path: '/' })).toContain('Quality Books');
  const snapshot = await tools.page_snapshot({});
  expect(snapshot).toContain('Prompting for QA');
  expect(snapshot).toContain('34.00 EUR');
  expect(snapshot).toContain('button "Add Testing in Production to cart"');
  expect(snapshot).toMatch(/button "Add The Pragmatic Tester to cart" \[disabled\]/);
});

test('click and snapshot reveal the cart totals', async ({ page }) => {
  const { tools } = toolbox(page);
  await tools.open_page({ path: '/' });
  await tools.click({ role: 'button', name: 'Add Testing in Production to cart' });
  await tools.click({ role: 'button', name: 'Add Testing in Production to cart' });
  const snapshot = await tools.page_snapshot({});
  expect(snapshot).toContain('Subtotal: 59.98 EUR');
  expect(snapshot).toContain('Shipping: 0.00 EUR');
});

test('fill + submit waits for the assistant and shows its answer', async ({ page }) => {
  const { tools } = toolbox(page);
  await tools.open_page({ path: '/' });
  await tools.fill({ label: 'Your question', text: 'How much is Prompting for QA?', submit: true });
  expect(await tools.page_snapshot({})).toContain('costs 34.00 EUR');
});

test('a wrong locator comes back as an error message, not a crash', async ({ page }) => {
  const { tools } = toolbox(page);
  await tools.open_page({ path: '/' });
  expect(await tools.click({ role: 'button', name: 'Checkout' })).toMatch(/^ERROR:/);
});

test('report_finding records the finding', async ({ page }) => {
  const { tools, findings } = toolbox(page);
  await tools.report_finding({ severity: 'major', title: 't', steps: ['a'], expected: 'e', actual: 'a', rule: 'r' });
  expect(findings).toHaveLength(1);
});
