import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ShopPage } from '../../05-ui-e2e/e2e/pages/ShopPage.js';

// Learning Path, Topic 9 — accessibility beyond "axe says zero".

test('no WCAG 2.2 A/AA violations that axe can detect', async ({ page }) => {
  const shop = new ShopPage(page);
  await shop.goto();
  await expect(shop.recommendations).toHaveCount(2);
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
});

// WCAG 2.5.3 Label in Name: what a button says on screen must be part of its
// accessible name, so a voice-control user who says "click Add to cart"
// reaches it. axe only checks this with its experimental rules switched on.
test('every button\'s accessible name contains the words it shows', async ({ page }) => {
  test.fail(true, 'real bug: buttons show "Add to cart" / "Out of stock" but are named "Add <title> to cart"; Topic 9 lab, step 4');
  const shop = new ShopPage(page);
  await shop.goto();
  const { violations } = await new AxeBuilder({ page }).withRules(['label-content-name-mismatch']).analyze();
  expect(violations.flatMap((v) => v.nodes.map((n) => n.html))).toEqual([]);
});

// A screen-reader user adds a book and hears… nothing. The total changes
// visually, but nothing tells assistive technology to announce it.
test('the cart announces its new total to screen readers', async ({ page }) => {
  test.fail(true, 'real gap: the cart total is not in a live region; Topic 9 lab, step 4');
  const shop = new ShopPage(page);
  await shop.goto();
  await shop.addToCart('Testing in Production');
  await expect(shop.cart.getByRole('status')).toContainText('34.89');
});
