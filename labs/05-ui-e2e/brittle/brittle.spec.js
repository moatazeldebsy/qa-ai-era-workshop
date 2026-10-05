import { test, expect } from '@playwright/test';

// Learning Path, Topic 5, lab step 1 — brittle on purpose.
//
// Both tests pass today. Each one breaks the moment someone reorders the
// catalogue, restyles the page, adds a second input, changes the port, or
// runs it on a slow machine. Rewrite them, don't fix this file:
// write labs/05-ui-e2e/e2e/tests/refactored.spec.js.

test('adding a book updates the total', async ({ page }) => {
  await page.goto('http://localhost:3210/');
  await page.waitForTimeout(1000);
  await page.click('#book-list > li:nth-child(1) > button');
  await page.waitForTimeout(500);
  const total = await page.$eval('[data-testid=total]', (el) => el.textContent);
  expect(total).toBe('34.89');
});

test('search', async ({ page }) => {
  await page.goto('http://localhost:3210/');
  await page.fill('input', 'k6');
  await page.waitForTimeout(1000);
  const titles = await page.locator('.title').allTextContents();
  expect(titles.length).toBe(1);
  expect(titles[0]).toBe('Performance Engineering with k6');
});
