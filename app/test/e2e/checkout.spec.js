import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The whole customer cycle in a real browser against the real shop and
// inventory service: account → cart → checkout → Demo Pay → order history.
//
// Tests run in parallel against ONE inventory service, so each test that
// places an order uses its own book, with stock to spare for every worker:
// two workers ordering 2 of a book with 3 left would make one of them fail
// with "sold out", correctly.

const uniqueEmail = () => `shopper-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

async function addToCart(page, title, total) {
  await page.goto('/');
  await page.getByRole('button', { name: new RegExp(title) }).click();
  await expect(page.getByTestId('total')).toHaveText(total);
}

async function fillDeliveryAndCard(page, cardNumber) {
  await page.getByLabel('Full name').fill('Grace Hopper');
  await page.getByLabel('Street and number').fill('1 Harbour Road');
  await page.getByLabel('City').fill('Arlington');
  await page.getByLabel('Postcode').fill('22201');
  await page.getByLabel('Country').fill('USA');
  await page.getByLabel('Card number').fill(cardNumber);
  await page.getByLabel('Expiry (MM/YY)').fill('12/39');
  await page.getByLabel('Security code').fill('123');
}

test('a new customer registers, pays by card, and cancels the order from their account', async ({ page }) => {
  const email = uniqueEmail();
  await page.goto('/account.html');
  const register = page.getByRole('form', { name: 'Create an account' });
  await register.getByLabel('Name').fill('Grace Hopper');
  await register.getByLabel('Email').fill(email);
  await register.getByLabel('Password').fill('a-long-password');
  await register.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Hello, Grace Hopper' })).toBeVisible();
  await expect(page.getByText('No orders yet.')).toBeVisible();

  await addToCart(page, 'Testing in Production', '34.89');
  await expect(page.getByRole('link', { name: 'My account' })).toBeVisible();
  await page.getByRole('link', { name: 'Go to checkout' }).click();

  await expect(page.getByLabel('Email')).toHaveValue(email);
  await page.getByLabel('Quantity of Testing in Production').fill('2');
  await page.getByLabel('Quantity of Testing in Production').blur();
  await expect(page.getByTestId('total')).toHaveText('59.98'); // free shipping from 50 EUR
  await fillDeliveryAndCard(page, '4242 4242 4242 4242');
  await page.getByRole('button', { name: 'Pay 59.98 EUR' }).click();

  await expect(page.getByRole('heading', { name: 'Thank you, your order is paid' })).toBeFocused();
  await expect(page.getByTestId('order-total')).toHaveText('59.98');
  const orderId = await page.getByTestId('order-id').textContent();

  await page.getByRole('link', { name: 'See your orders' }).click();
  const row = page.getByTestId(`order-${orderId}`);
  await expect(row).toContainText('2 × Testing in Production');
  await expect(row).toContainText('paid');
  await row.getByRole('button', { name: /^Cancel order/ }).click();
  await expect(row).toContainText('cancelled');
  await expect(row.getByRole('button')).toHaveCount(0);

  // The cart was emptied by the order.
  await page.goto('/checkout.html');
  await expect(page.getByText('Your cart is empty.')).toBeVisible();
});

// On main, a declined payment doesn't release its stock yet (the Topic 3 lab
// fixes that), so each run of this test holds one copy of book 6 until the
// inventory service restarts.
test('a declined card shows why and keeps the order to try again', async ({ page }) => {
  await addToCart(page, 'Responsible AI Testing', '44.80');
  await page.getByRole('link', { name: 'Go to checkout' }).click();
  await page.getByLabel('Email').fill(uniqueEmail());
  await fillDeliveryAndCard(page, '4000 0000 0000 0002');
  await page.getByRole('button', { name: 'Pay 44.80 EUR' }).click();

  await expect(page.getByRole('alert')).toHaveText('Payment failed: card declined. No money was taken; try another card.');
  await expect(page.getByLabel('Quantity of Responsible AI Testing')).toHaveValue('1');
  await expect(page.getByRole('button', { name: 'Pay 44.80 EUR' })).toBeEnabled();
});

test('a mistyped card number is caught in the browser and never sent', async ({ page }) => {
  const orderRequests = [];
  page.on('request', (req) => req.url().endsWith('/api/orders') && orderRequests.push(req));

  await addToCart(page, 'Testing in Production', '34.89');
  await page.getByRole('link', { name: 'Go to checkout' }).click();
  await page.getByLabel('Email').fill(uniqueEmail());
  await fillDeliveryAndCard(page, '4242 4242 4242 4241');
  await page.getByRole('button', { name: 'Pay 34.89 EUR' }).click();

  await expect(page.getByRole('alert')).toHaveText('Check your card: card number is invalid.');
  await expect(page.getByLabel('Card number')).toBeFocused();
  await expect(page.getByLabel('Card number')).toHaveAttribute('aria-invalid', 'true');
  expect(orderRequests).toHaveLength(0);
});

test('signing in from checkout comes back to checkout with the cart intact', async ({ page }) => {
  await addToCart(page, 'Contract Testing in Practice', '36.15');
  await page.getByRole('link', { name: 'Go to checkout' }).click();
  await page.getByRole('link', { name: 'Sign in' }).last().click();

  const signIn = page.getByRole('form', { name: 'Sign in' });
  await signIn.getByLabel('Email').fill('ada@example.com');
  await signIn.getByLabel('Password').fill('wrong-password');
  await signIn.getByRole('button', { name: 'Sign in' }).click();
  await expect(signIn.getByRole('alert')).toHaveText('email or password is incorrect');

  await signIn.getByLabel('Password').fill('quality-books-demo');
  await signIn.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/checkout\.html$/);
  await expect(page.getByLabel('Email')).toHaveValue('ada@example.com');
  await expect(page.getByLabel('Quantity of Contract Testing in Practice')).toHaveValue('1');
});

test('the account and checkout pages have no WCAG A/AA violations axe can detect', async ({ page }) => {
  const scan = async () => (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()).violations.map((v) => v.id);

  await page.goto('/account.html');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  expect(await scan()).toEqual([]);

  await addToCart(page, 'Contract Testing in Practice', '36.15');
  await page.getByRole('link', { name: 'Go to checkout' }).click();
  await expect(page.getByLabel('Quantity of Contract Testing in Practice')).toBeVisible();
  expect(await scan()).toEqual([]);
});
