import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { books, policies } from '../../../app/src/catalog.js';
import { priceCart, shippingFor, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '../../../app/src/cart.js';

// Learning Path, Topic 1 — QA Engineering Foundations.
//
// Every test needs an ORACLE: a way to decide whether an output is right.
// Each describe() block below uses a different kind of oracle on the same
// feature (pricing a cart), so you can compare what each one can and can't see.
//
// These tests do NOT pass bugMode explicitly, so `BUG_MODE=cart` in the
// environment reaches the code under test. `npm run foundations:bug-hunt`
// uses that to check whether this suite would catch a real regression.

const inStock = books.filter((b) => b.stock > 0);

// Every cart the shop can actually sell: each in-stock book at 0..min(stock, 10)
// copies, at least one line. About 19,000 carts, priced in well under a second.
function* allSellableCarts(i = 0, items = []) {
  if (i === inStock.length) {
    if (items.length) yield items;
    return;
  }
  const book = inStock[i];
  for (let q = 0; q <= Math.min(book.stock, 10); q++) {
    yield* allSellableCarts(i + 1, q ? [...items, { bookId: book.id, quantity: q }] : items);
  }
}

describe('1. Specified oracle: the rule, written down', () => {
  // The requirement says where the line is, so the test checks either side of
  // it and the line itself. That is boundary value analysis (Topic 2).
  test('49.99 EUR pays shipping', () => assert.equal(shippingFor(49.99), SHIPPING_FEE));
  test('50.00 EUR ships free (the agreed boundary)', () => assert.equal(shippingFor(50), 0));
  test('50.01 EUR ships free', () => assert.equal(shippingFor(50.01), 0));

  test('a 2 x 29.99 cart (59.98 EUR) ships free', () => {
    const cart = priceCart([{ bookId: 1, quantity: 2 }]);
    assert.deepEqual([cart.subtotal, cart.shipping, cart.total], [59.98, 0, 59.98]);
  });
});

describe('2. Invariant oracle: things that must hold for every input', () => {
  // We don't know the expected total of 19,000 carts, but we know rules every
  // correct answer obeys. Checking them on every sellable cart finds bugs that
  // no hand-picked example would.
  test('every sellable cart obeys the pricing invariants', () => {
    let checked = 0;
    for (const items of allSellableCarts()) {
      const cart = priceCart(items);
      const lineSum = Math.round(cart.lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
      const expectedShipping = cart.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
      const where = JSON.stringify(items);
      assert.equal(cart.subtotal, lineSum, `subtotal is the sum of lines: ${where}`);
      assert.equal(cart.shipping, expectedShipping, `shipping follows the subtotal: ${where}`);
      assert.equal(cart.total, Math.round((cart.subtotal + cart.shipping) * 100) / 100, `total = subtotal + shipping: ${where}`);
      checked += 1;
    }
    assert.ok(checked > 10_000, `expected to check over 10,000 carts, checked ${checked}`);
  });

  test('no sellable cart prices at exactly 50.00 EUR (why shippingFor exists)', () => {
    // A testability finding, kept as a test: if the catalogue changes so that
    // 50.00 becomes reachable, this fails and tells you the boundary can now be
    // tested end to end too.
    for (const items of allSellableCarts()) {
      assert.notEqual(priceCart(items).subtotal, 50, JSON.stringify(items));
    }
  });
});

describe('3. Consistency oracle: every source of truth must agree', () => {
  // The rule lives in three places: the code, the API contract, and the policy
  // text the AI assistant quotes to customers. A tester reads all three.
  const openapi = fs.readFileSync(new URL('../../../app/openapi.yaml', import.meta.url), 'utf8');

  test('the API contract states the same threshold as the code', () => {
    assert.match(openapi, new RegExp(`free when the subtotal is ${FREE_SHIPPING_THRESHOLD} EUR or more`));
  });

  // Was a known finding: the policy said "over 50 EUR" while the code and
  // contract said >= 50. Resolved by moving the policy text (the least
  // authoritative source) to the agreed rule; this test keeps them together.
  test('the customer-facing policy states the same threshold as the code', () => {
    assert.match(policies.shipping, new RegExp(`${FREE_SHIPPING_THRESHOLD} EUR or more`));
  });
});
