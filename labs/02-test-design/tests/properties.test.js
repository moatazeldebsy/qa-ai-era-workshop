import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { books } from '../../../app/src/catalog.js';
import { priceCart, ValidationError, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '../../../app/src/cart.js';
import { next, STATES, EVENTS, InvalidTransition } from '../../../app/src/orders.js';

// Learning Path, Topic 2 — property-based testing with fast-check.
//
// Instead of choosing inputs, describe the SHAPE of valid inputs (a generator,
// called an "arbitrary") and a PROPERTY that must hold for all of them.
// fast-check tries 100 random inputs per property; when one fails it SHRINKS it
// to the smallest input that still fails, and prints the seed to replay it.
//
// No bugMode is passed, so BUG_MODE=cart in the environment reaches the code.

// Replay a failure exactly: FC_SEED=<seed it printed> npm run design:test.
// The mutation scorecard also pins a seed, so its results are the same every run.
if (process.env.FC_SEED) fc.configureGlobal({ seed: Number(process.env.FC_SEED) });

const inStock = books.filter((b) => b.stock > 0);
const cents = (n) => Math.round(n * 100) / 100;

// A sellable cart: 1..5 DIFFERENT in-stock books, each with a valid quantity.
// The word DIFFERENT is an assumption baked into the generator. The last
// property below drops it.
const sellableCart = fc
  .uniqueArray(fc.constantFrom(...inStock), { minLength: 1, maxLength: inStock.length, selector: (b) => b.id })
  .chain((picked) =>
    fc.tuple(...picked.map((b) => fc.integer({ min: 1, max: Math.min(b.stock, 10) }).map((quantity) => ({ bookId: b.id, quantity })))),
  );

describe('pricing properties', () => {
  test('total = subtotal + shipping, and shipping is 0 or the fee', () => {
    fc.assert(
      fc.property(sellableCart, (items) => {
        const c = priceCart(items);
        assert.ok([0, SHIPPING_FEE].includes(c.shipping));
        assert.equal(c.total, cents(c.subtotal + c.shipping));
      }),
    );
  });

  test('shipping is decided by the subtotal', () => {
    fc.assert(
      fc.property(sellableCart, (items) => {
        const c = priceCart(items);
        assert.equal(c.shipping, c.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE);
      }),
    );
  });

  test('every amount is a whole number of cents', () => {
    fc.assert(
      fc.property(sellableCart, (items) => {
        const c = priceCart(items);
        for (const amount of [...c.lines.map((l) => l.lineTotal), c.subtotal, c.total]) assert.equal(amount, cents(amount));
      }),
    );
  });

  test('the order of lines does not change the price (metamorphic)', () => {
    // A METAMORPHIC property: we don't know the right total, but we know two
    // related inputs must give the same one.
    fc.assert(
      fc.property(sellableCart, (items) => {
        assert.equal(priceCart([...items].reverse()).total, priceCart(items).total);
      }),
    );
  });

  test('adding a line never lowers the subtotal (metamorphic)', () => {
    fc.assert(
      fc.property(sellableCart, (items) => {
        fc.pre(items.length > 1);
        assert.ok(priceCart(items).subtotal >= priceCart(items.slice(0, -1)).subtotal);
      }),
    );
  });
});

describe('order lifecycle properties (model-based)', () => {
  const claim = { daysSinceDelivery: 1, originalCondition: true, arrivedDamaged: false };

  test('any sequence of events keeps the order in a known state, and final states stay final', () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom(...EVENTS), { maxLength: 12 }), (events) => {
        let state = 'placed';
        for (const event of events) {
          const before = state;
          try {
            state = next(state, event, claim);
          } catch (err) {
            if (!(err instanceof InvalidTransition)) throw err;
          }
          assert.ok(STATES.includes(state));
          if (['cancelled', 'refunded'].includes(before)) assert.equal(state, before);
        }
      }),
    );
  });
});

describe('dropping a generator assumption', () => {
  // Any cart a customer can SEND, duplicates included. The property: the shop
  // either rejects it, or never sells more copies of a book than it has.
  const anyCart = fc.array(
    fc.record({ bookId: fc.constantFrom(...inStock.map((b) => b.id)), quantity: fc.integer({ min: 1, max: 10 }) }),
    { minLength: 1, maxLength: 6 },
  );

  test(
    'an accepted cart never sells more copies than are in stock',
    () => {
      fc.assert(
        fc.property(anyCart, (items) => {
          try {
            priceCart(items);
          } catch (err) {
            if (err instanceof ValidationError) return;
            throw err;
          }
          for (const b of inStock) {
            const sold = items.filter((i) => i.bookId === b.id).reduce((n, i) => n + i.quantity, 0);
            assert.ok(sold <= b.stock, `sold ${sold} of book ${b.id}, stock ${b.stock}`);
          }
        }),
      );
    },
  );
});
