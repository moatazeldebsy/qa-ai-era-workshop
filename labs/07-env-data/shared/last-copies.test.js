import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stock, reserve, release } from './helpers.js';

// Relies on the shared environment's seed data: book 5 starts with 3 copies.
test('reserving the last copies of a book leaves none', async () => {
  assert.equal(await stock(5), 3);
  const { status, body } = await reserve(5, 3);
  assert.equal(status, 201);
  assert.equal(await stock(5), 0);
  await release(body.reservationId);
});
