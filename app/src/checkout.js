import crypto from 'node:crypto';
import { priceCart } from './cart.js';

// Placing an order: price the cart → reserve the stock → charge the card →
// send a confirmation. Everything that talks to the outside world is passed
// in, so a test can replace it with a test double:
//
//   inventory  { reserve(lines) → reservationId, release(reservationId) }
//   payments   { charge({ amount, currency, token }) → { id } }   throws when declined
//   mailer     { send({ to, subject, body }) }
//   clock      () → Date
//   newId      () → string
//
// The pricing rules are NOT injected: priceCart is fast, deterministic and
// ours, so tests use the real one (a "sociable" unit test).

export class CheckoutError extends Error {}

export function createCheckout({ inventory, payments, mailer, clock = () => new Date(), newId = () => crypto.randomUUID() }) {
  return {
    async placeOrder({ items, customer, paymentToken }) {
      const priced = priceCart(items);
      const reservationId = await inventory.reserve(priced.lines.map(({ bookId, quantity }) => ({ bookId, quantity })));

      let payment;
      try {
        payment = await payments.charge({ amount: priced.total, currency: 'EUR', token: paymentToken });
      } catch (err) {
        throw new CheckoutError(`payment failed: ${err.message}`);
      }

      const order = {
        id: newId(),
        state: 'paid',
        placedAt: clock().toISOString(),
        lines: priced.lines,
        subtotal: priced.subtotal,
        shipping: priced.shipping,
        total: priced.total,
        paymentId: payment.id,
        reservationId,
      };
      await mailer.send({
        to: customer.email,
        subject: `Your Quality Books order ${order.id}`,
        body: `Thank you! We charged ${order.total.toFixed(2)} EUR and will ship within 3-5 business days.`,
      });
      return order;
    },
  };
}
