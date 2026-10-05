import { test, expect } from '@playwright/test';

// Topic 5 - the same check, fixed. A web-first assertion retries until the
// condition holds or the timeout expires, so it is exactly as fast as the
// server and never faster.
test('GOOD: waits for the condition, not for a clock', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#recommendations li')).toHaveCount(2);
});

// And the deterministic option: control the dependency instead of waiting on
// it. Stubbing the network makes the test independent of server timing.
test('GOOD: stubs the slow dependency', async ({ page }) => {
  await page.route('**/api/recommendations', (route) =>
    route.fulfill({ json: { books: [{ id: 9, title: 'Stubbed Book' }] } }),
  );
  await page.goto('/');
  await expect(page.locator('#recommendations li')).toHaveText(['Stubbed Book']);
});
