import { test, expect } from '@playwright/test';
import { ShopPage } from '../pages/ShopPage.js';

// Lab 1 - end-to-end journeys through the UI. Keep these few and focused on
// what only a browser can prove; the pricing rules themselves are covered
// faster and more thoroughly by the API tests (Lab 2) and unit tests.

test.describe('catalogue', () => {
  test('lists every book on load', async ({ page }) => {
    const shop = new ShopPage(page);
    await shop.goto();
    await expect(shop.books).toHaveCount(6);
  });

  test('search narrows the list by topic', async ({ page }) => {
    const shop = new ShopPage(page);
    await shop.goto();
    await shop.searchFor('ai');
    await expect(shop.books).toHaveCount(2);
    await expect(shop.books.first()).toContainText('Prompting for QA');
  });

  test('out-of-stock books cannot be added', async ({ page }) => {
    const shop = new ShopPage(page);
    await shop.goto();
    await expect(shop.addToCartButton('The Pragmatic Tester')).toBeDisabled();
  });
});

test.describe('cart', () => {
  test('charges shipping below the free-shipping threshold', async ({ page }) => {
    const shop = new ShopPage(page);
    await shop.goto();
    await shop.addToCart('Testing in Production');
    await expect(shop.subtotal).toHaveText('29.99');
    await expect(shop.shipping).toHaveText('4.90');
    await expect(shop.total).toHaveText('34.89');
  });

  test('ships free once the subtotal reaches 50 EUR', async ({ page }) => {
    const shop = new ShopPage(page);
    await shop.goto();
    await shop.addToCart('Testing in Production', 2);
    await expect(shop.subtotal).toHaveText('59.98');
    await expect(shop.shipping).toHaveText('0.00');
    await expect(shop.total).toHaveText('59.98');
  });

  test('shows a clear error when asking for more than is in stock', async ({ page }) => {
    const shop = new ShopPage(page);
    await shop.goto();
    await shop.addToCart('Performance Engineering with k6', 4);
    await expect(shop.cartError).toHaveText('only 3 of "Performance Engineering with k6" in stock');
  });
});

test('recommendations appear without a fixed sleep', async ({ page }) => {
  const shop = new ShopPage(page);
  await shop.goto();
  // Web-first assertion: retries until the list renders (up to the expect
  // timeout). Compare with labs/flaky/tests/recommendations.bad.spec.js.
  await expect(shop.recommendations).toHaveCount(2);
});
