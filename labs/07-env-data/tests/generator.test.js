import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateOrders } from '../generate.mjs';
import { priceCart } from '../../../app/src/cart.js';
import { books } from '../../../app/src/catalog.js';

// Learning Path, Topic 7 — test data that you can trust and reproduce.

test('every generated order is valid: real books, stock respected, shop prices', () => {
  for (const order of generateOrders({ count: 300, seed: 11 })) {
    for (const line of order.lines) {
      const book = books.find((b) => b.id === line.bookId);
      assert.ok(book, `unknown book ${line.bookId}`);
      assert.ok(line.quantity <= book.stock, `${order.id} sells ${line.quantity} of ${book.title}`);
    }
    const repriced = priceCart(order.lines.map(({ bookId, quantity }) => ({ bookId, quantity })), { bugMode: undefined });
    assert.equal(order.total, repriced.total, order.id);
  }
});

test('the history contains every order state a real shop has', () => {
  const states = new Set(generateOrders({ count: 300, seed: 3 }).map((o) => o.state));
  assert.deepEqual([...states].sort(), ['cancelled', 'delivered', 'paid', 'refunded', 'shipped']);
});

// Found when a failing report test couldn't be reproduced: the next run
// generated different orders, and the failure was gone.
test(
  'the same seed always gives the same data',
  { todo: 'real gap: the generator ignores its seed (Math.random); Topic 7 lab, step 3' },
  () => {
    assert.deepEqual(generateOrders({ count: 50, seed: 42 }), generateOrders({ count: 50, seed: 42 }));
    assert.notDeepEqual(generateOrders({ count: 50, seed: 42 }), generateOrders({ count: 50, seed: 43 }));
  },
);
