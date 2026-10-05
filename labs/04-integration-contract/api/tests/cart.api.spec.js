import { test, expect } from '@playwright/test';

// Pricing rules, data-driven. Each row is a business rule someone could get
// wrong; Topic 6 starts the app with BUG_MODE=cart and these rows catch it.
const pricing = [
  { name: 'single cheap book pays shipping', items: [{ bookId: 1, quantity: 1 }], subtotal: 29.99, shipping: 4.9, total: 34.89 },
  { name: 'exactly over the threshold ships free', items: [{ bookId: 1, quantity: 2 }], subtotal: 59.98, shipping: 0, total: 59.98 },
  { name: 'mixed basket over threshold ships free', items: [{ bookId: 3, quantity: 1 }, { bookId: 5, quantity: 1 }], subtotal: 61, shipping: 0, total: 61 },
  { name: 'two different books over threshold ship free', items: [{ bookId: 1, quantity: 1 }, { bookId: 4, quantity: 1 }], subtotal: 61.24, shipping: 0, total: 61.24 },
  { name: 'expensive single book below threshold', items: [{ bookId: 6, quantity: 1 }], subtotal: 39.9, shipping: 4.9, total: 44.8 },
];

test.describe('POST /api/cart/price - pricing rules', () => {
  for (const row of pricing) {
    test(row.name, async ({ request }) => {
      const res = await request.post('/api/cart/price', { data: { items: row.items } });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({ subtotal: row.subtotal, shipping: row.shipping, total: row.total });
    });
  }
});

const invalid = [
  { name: 'empty cart', items: [], error: 'items must be a non-empty array' },
  { name: 'missing items', items: undefined, error: 'items must be a non-empty array' },
  { name: 'unknown book', items: [{ bookId: 42, quantity: 1 }], error: 'unknown book 42' },
  { name: 'zero quantity', items: [{ bookId: 1, quantity: 0 }], error: 'quantity must be an integer from 1 to 10' },
  { name: 'fractional quantity', items: [{ bookId: 1, quantity: 1.5 }], error: 'quantity must be an integer from 1 to 10' },
  { name: 'quantity over limit', items: [{ bookId: 1, quantity: 11 }], error: 'quantity must be an integer from 1 to 10' },
  { name: 'more than in stock', items: [{ bookId: 5, quantity: 4 }], error: 'only 3 of "Performance Engineering with k6" in stock' },
  { name: 'out of stock', items: [{ bookId: 2, quantity: 1 }], error: 'only 0 of "The Pragmatic Tester" in stock' },
];

test.describe('POST /api/cart/price - validation', () => {
  for (const row of invalid) {
    test(`rejects ${row.name}`, async ({ request }) => {
      const res = await request.post('/api/cart/price', { data: { items: row.items } });
      expect(res.status()).toBe(400);
      expect(await res.json()).toEqual({ error: row.error });
    });
  }
});
