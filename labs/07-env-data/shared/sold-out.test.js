import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stock, reserve, release } from './helpers.js';

// Relies on the shared environment's seed data: book 5 starts with 3 copies.
test('a reservation for more than is left is refused', async () => {
  const first = await reserve(5, 2);
  assert.equal(first.status, 201);
  const second = await reserve(5, 2);
  assert.equal(second.status, 409);
  assert.equal(await stock(5), 1);
  await release(first.body.reservationId);
});
