import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stock, reserve, release } from './helpers.js';

// Relies on the shared environment's seed data: book 5 starts with 3 copies.
test('releasing a reservation puts the copies back', async () => {
  const held = await reserve(5, 1);
  assert.equal(await stock(5), 2);
  await release(held.body.reservationId);
  assert.equal(await stock(5), 3);
});
