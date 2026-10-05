import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../../../app/src/server.js';
import { serve, post } from '../tests/helpers.js';

process.env.LOG_REQUESTS = 'false';
let shop;
before(async () => (shop = await serve(createApp())));
after(() => shop.close());

for (const route of ['/api/cart/price', '/api/assistant', '/api/orders']) {
  test(`${route}: malformed JSON is a 400 with an error message`, async () => {
    const { status, body } = await post(`${shop.url}${route}`, '{"oops":', { raw: true });
    assert.equal(status, 400);
    assert.equal(typeof body?.error, 'string');
  });
  test(`${route}: a body over the limit is a 413`, async () => {
    const { status } = await post(`${shop.url}${route}`, { padding: 'x'.repeat(20_000) });
    assert.equal(status, 413);
  });
}

