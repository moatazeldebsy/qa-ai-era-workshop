import { test, expect } from '@playwright/test';
import { ShopPage } from '../e2e/pages/ShopPage.js';

// What `npm run learn:check 5` runs against your fixes. Different books and
// timings from journeys.spec.js, so a fix that only fits one test won't pass.

test('recovers from a stock error on a different book', async ({ page }) => {
  const shop = new ShopPage(page);
  await shop.goto();
  await shop.addToCart('Prompting for QA', 6); // 5 in stock
  await expect(shop.cartError).toContainText('only 5');
  await expect(shop.subtotal).toHaveText('170.00');
  await shop.addToCart('Testing in Production');
  await expect(shop.cartError).toHaveText('');
  await expect(shop.subtotal).toHaveText('199.99');
});

test('the first book added still counts after a rejected first add of another', async ({ page }) => {
  const shop = new ShopPage(page);
  await shop.goto();
  await shop.addToCart('Responsible AI Testing');
  await shop.addToCart('Performance Engineering with k6', 4);
  await expect(shop.cartError).toContainText('only 3');
  await shop.addToCart('Responsible AI Testing');
  await expect(shop.subtotal).toHaveText('160.80'); // 2 × 39.90 + 3 × 27.00
});

test('three quick adds with the slowest answer first still show the newest total', async ({ page }) => {
  const shop = new ShopPage(page);
  let calls = 0;
  const gates = [];
  await page.route('**/api/cart/price', async (route) => {
    const n = ++calls;
    const response = await route.fetch();
    if (n < 3) await new Promise((resolve) => gates.push(resolve)); // hold 1 and 2
    await route.fulfill({ response });
  });
  await shop.goto();
  await shop.addToCart('Contract Testing in Practice', 3);
  await expect(shop.subtotal).toHaveText('93.75');
  gates.reverse().forEach((release) => release()); // answers 2 then 1 arrive late
  await expect(shop.cart).toHaveAttribute('aria-busy', 'false');
  await expect(shop.subtotal).toHaveText('93.75');
});
