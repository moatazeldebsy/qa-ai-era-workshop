import { test, expect } from '@playwright/test';

// Topic 5 - a FLAKY test, on purpose. Run it ten times:
//
//   npm run test:flaky
//
// /api/recommendations takes 200-1500 ms. This test sleeps 700 ms and then
// checks once, so it passes when the server is fast and fails when it is slow.
// Nothing about the product changed between a pass and a fail - that is what
// makes a test flaky, and why "just add retries" only hides it.
test('BAD: sleeps a fixed time, then asserts once', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(700); // the bug
  const items = await page.locator('#recommendations li').count();
  expect(items).toBe(2);
});
