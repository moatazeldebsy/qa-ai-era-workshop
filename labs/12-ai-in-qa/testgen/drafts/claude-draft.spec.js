// AI-GENERATED DRAFT — not reviewed, not edited.
// Produced by Claude (the AI model that helped write this course) in answer to
// labs/12-ai-in-qa/testgen/prompts/generate-api-tests.md with app/openapi.yaml.
// It's here so Topic 12's lab works without an API key. Review it with
// review-checklist.md and score it with `npm run ai:score -- <this file>`
// before trusting a single line.
import { test, expect } from '@playwright/test';

// VERIFY: values below are guesses the spec doesn't state exactly.
const KNOWN_BOOK_ID = 1; // VERIFY: assumes book 1 exists
const UNKNOWN_BOOK_ID = 999999; // VERIFY: assumes this id is unused
const SHIPPING_FEE = 4.9; // from the spec: "Shipping is 4.90 EUR"
const FREE_SHIPPING_THRESHOLD = 50; // from the spec: "free when the subtotal is 50 EUR or more"

const bookShape = (book) => {
  expect(typeof book.id).toBe('number');
  expect(Number.isInteger(book.id)).toBe(true);
  expect(typeof book.title).toBe('string');
  expect(typeof book.author).toBe('string');
  expect(typeof book.price).toBe('number');
  expect(Number.isInteger(book.stock)).toBe(true);
  expect(Array.isArray(book.tags)).toBe(true);
};

test.describe('GET /api/books', () => {
  test('lists books, each with the documented Book shape', async ({ request }) => {
    const res = await request.get('/api/books');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.books)).toBe(true);
    expect(body.books.length).toBeGreaterThan(0);
    body.books.forEach(bookShape);
  });

  test('search is case-insensitive', async ({ request }) => {
    const lower = await (await request.get('/api/books?q=ai')).json();
    const upper = await (await request.get('/api/books?q=AI')).json();
    expect(upper.books.map((b) => b.id)).toEqual(lower.books.map((b) => b.id));
  });

  test('a search that matches nothing returns an empty list, not an error', async ({ request }) => {
    const res = await request.get('/api/books?q=zzzz-no-such-book-zzzz');
    expect(res.status()).toBe(200);
    expect((await res.json()).books).toEqual([]);
  });

  test('an empty search returns the same books as no search', async ({ request }) => {
    const all = await (await request.get('/api/books')).json();
    const empty = await (await request.get('/api/books?q=')).json();
    expect(empty.books.length).toBe(all.books.length);
  });
});

test.describe('GET /api/books/{id}', () => {
  test('returns one book with the Book shape', async ({ request }) => {
    const res = await request.get(`/api/books/${KNOWN_BOOK_ID}`);
    expect(res.status()).toBe(200);
    const book = await res.json();
    bookShape(book);
    expect(book.id).toBe(KNOWN_BOOK_ID);
  });

  test('an unknown id is a 404 with an error message', async ({ request }) => {
    const res = await request.get(`/api/books/${UNKNOWN_BOOK_ID}`);
    expect(res.status()).toBe(404);
    expect(typeof (await res.json()).error).toBe('string');
  });
});

test.describe('POST /api/cart/price — business rules', () => {
  test('total is subtotal plus shipping, and shipping follows the threshold', async ({ request }) => {
    const res = await request.post('/api/cart/price', { data: { items: [{ bookId: KNOWN_BOOK_ID, quantity: 1 }] } });
    expect(res.status()).toBe(200);
    const cart = await res.json();
    expect(cart.total).toBeCloseTo(cart.subtotal + cart.shipping, 2);
    expect(cart.shipping).toBe(cart.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE);
  });

  test('a cart reaching the free-shipping threshold ships free', async ({ request }) => {
    // Grow the quantity of one book until the subtotal reaches the threshold.
    const book = await (await request.get(`/api/books/${KNOWN_BOOK_ID}`)).json();
    const quantity = Math.min(10, Math.ceil(FREE_SHIPPING_THRESHOLD / book.price));
    const cart = await (await request.post('/api/cart/price', { data: { items: [{ bookId: KNOWN_BOOK_ID, quantity }] } })).json();
    expect(cart.subtotal).toBeGreaterThanOrEqual(FREE_SHIPPING_THRESHOLD);
    expect(cart.shipping).toBe(0);
  });

  test('response has lines, subtotal, shipping and total', async ({ request }) => {
    const cart = await (await request.post('/api/cart/price', { data: { items: [{ bookId: KNOWN_BOOK_ID, quantity: 1 }] } })).json();
    expect(Array.isArray(cart.lines)).toBe(true);
    for (const key of ['subtotal', 'shipping', 'total']) expect(typeof cart[key]).toBe('number');
  });
});

test.describe('POST /api/cart/price — boundaries and invalid input', () => {
  const valid = [1, 10];
  for (const quantity of valid) {
    test(`quantity ${quantity} (a boundary of 1..10) is accepted if in stock`, async ({ request }) => {
      // VERIFY: assumes book 1 has at least 10 in stock
      const res = await request.post('/api/cart/price', { data: { items: [{ bookId: KNOWN_BOOK_ID, quantity }] } });
      expect(res.status()).toBe(200);
    });
  }

  const invalid = [
    { name: 'quantity 0 (below minimum)', items: [{ bookId: KNOWN_BOOK_ID, quantity: 0 }] },
    { name: 'quantity 11 (above maximum)', items: [{ bookId: KNOWN_BOOK_ID, quantity: 11 }] },
    { name: 'a fractional quantity', items: [{ bookId: KNOWN_BOOK_ID, quantity: 1.5 }] },
    { name: 'an empty items array (minItems 1)', items: [] },
    { name: 'a missing quantity', items: [{ bookId: KNOWN_BOOK_ID }] },
    { name: 'a missing bookId', items: [{ quantity: 1 }] },
    { name: 'an unknown book', items: [{ bookId: UNKNOWN_BOOK_ID, quantity: 1 }] },
    { name: 'a bookId that is a string', items: [{ bookId: String(KNOWN_BOOK_ID), quantity: 1 }] },
  ];
  for (const { name, items } of invalid) {
    test(`rejects ${name} with a 400 error`, async ({ request }) => {
      const res = await request.post('/api/cart/price', { data: { items } });
      expect(res.status()).toBe(400);
      expect(typeof (await res.json()).error).toBe('string');
    });
  }

  test('rejects a body without items', async ({ request }) => {
    const res = await request.post('/api/cart/price', { data: {} });
    expect(res.status()).toBe(400);
  });
});

test.describe('POST /api/assistant', () => {
  test('answers a question with a string answer and a known mode', async ({ request }) => {
    const res = await request.post('/api/assistant', { data: { question: 'How long does shipping take?' } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.answer).toBe('string');
    expect(['mock', 'buggy', 'claude']).toContain(body.mode);
  });

  test('a question at the 1000-character limit is accepted', async ({ request }) => {
    const res = await request.post('/api/assistant', { data: { question: 'a'.repeat(1000) } });
    expect(res.status()).toBe(200);
  });

  test('a question over the 1000-character limit is rejected', async ({ request }) => {
    // VERIFY: the spec says maxLength 1000 but documents no error response
    const res = await request.post('/api/assistant', { data: { question: 'a'.repeat(1001) } });
    expect(res.status()).toBe(400);
  });
});
