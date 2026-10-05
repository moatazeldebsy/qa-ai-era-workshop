import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../../../app/src/server.js';
import { serve, get, post, deadUrl, openApiContract } from './helpers.js';

// Learning Path, Topic 4 — API tests, in process.
//
// The real Express app, started on a random port inside the test process: no
// separate server to start, and still real HTTP (routing, JSON parsing,
// status codes, headers). Every response is also checked against the
// published contract, app/openapi.yaml.

process.env.LOG_REQUESTS = 'false';
const contract = openApiContract('app/openapi.yaml');
let shop;
before(async () => (shop = await serve(createApp({ inventoryUrl: await deadUrl() }))));
after(() => shop.close());

describe('responses match the published contract', () => {
  const cases = [
    ['/api/books', 'get', () => get(`${shop.url}/api/books`), 200],
    ['/api/books', 'get', () => get(`${shop.url}/api/books?q=ai`), 200],
    ['/api/books/{id}', 'get', () => get(`${shop.url}/api/books/3`), 200],
    ['/api/books/{id}', 'get', () => get(`${shop.url}/api/books/42`), 404],
    ['/api/cart/price', 'post', () => post(`${shop.url}/api/cart/price`, { items: [{ bookId: 1, quantity: 2 }] }), 200],
    ['/api/cart/price', 'post', () => post(`${shop.url}/api/cart/price`, { items: [{ bookId: 1, quantity: 11 }] }), 400],
    ['/api/assistant', 'post', () => post(`${shop.url}/api/assistant`, { question: 'How much is Prompting for QA?' }), 200],
  ];
  for (const [path, method, call, expected] of cases) {
    test(`${method.toUpperCase()} ${path} → ${expected}`, async () => {
      const { status, body } = await call();
      assert.equal(status, expected);
      assert.deepEqual(contract(path, method, status, body), []);
    });
  }
});

describe('HTTP behaviour', () => {
  test('every response carries a request id, and echoes one it was given', async () => {
    const res = await fetch(`${shop.url}/api/books`, { headers: { 'x-request-id': 'trace-123' } });
    assert.equal(res.headers.get('x-request-id'), 'trace-123');
  });

  test('a cart that breaks the rules gets a 400 that says why', async () => {
    const { status, body } = await post(`${shop.url}/api/cart/price`, { items: [] });
    assert.equal(status, 400);
    assert.match(body.error, /non-empty/);
  });

  test('the inventory service being down is a 503, not a 500', async () => {
    const { status } = await post(`${shop.url}/api/orders`, { items: [{ bookId: 1, quantity: 1 }], paymentToken: 'tok_visa' });
    assert.equal(status, 503);
  });

  // Found by sending what clients really send when they have a bug: broken
  // JSON, and far too much of it. Both are the CLIENT's mistake (4xx), but
  // the shop answers 500, which says "our fault", pages the on-call engineer,
  // and is not in the contract.
  test(
    'client mistakes are 4xx, never 500: malformed JSON and oversized bodies',
    async () => {
      const broken = await post(`${shop.url}/api/cart/price`, '{"items": [', { raw: true });
      assert.equal(broken.status, 400);
      assert.equal(typeof broken.body.error, 'string');
      const huge = await post(`${shop.url}/api/assistant`, { question: 'a'.repeat(20_000) });
      assert.equal(huge.status, 413);
    },
  );
});
