import { test, expect } from '@playwright/test';

// Topic 5 — this test used to sleep 700 ms and then count once, so
// it failed whenever the server took longer. Fixed: a web-first assertion
// waits for the condition itself, as long as it takes (up to the timeout).
test('BAD (now fixed): waits for the recommendations instead of a clock', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#recommendations li')).toHaveCount(2);
});
