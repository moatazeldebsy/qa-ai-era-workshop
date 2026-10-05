// "Demo Pay": a pretend payment provider's browser SDK, the way real ones
// (Stripe Elements, Adyen, Braintree) work. The card details are checked and
// swapped for a token here, in the browser, so the shop's server only ever
// sees the token, never a card number (Topic 7: PCI DSS).
//
// Test cards (any future expiry, any 3-digit CVC):
//   4242 4242 4242 4242  approves           → tok_visa
//   4000 0000 0000 0002  is declined        → tok_declined
//   4000 0000 0000 9995  insufficient funds → tok_insufficient_funds
// Any other number that passes the checksum is an unknown card.

export const TEST_CARDS = {
  4242424242424242: 'tok_visa',
  4000000000000002: 'tok_declined',
  4000000000009995: 'tok_insufficient_funds',
};

export class CardError extends Error {
  constructor(message, field) {
    super(message);
    this.field = field;
  }
}

/** The Luhn checksum every card number carries, which catches most typos. */
export function luhnValid(digits) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/**
 * Check a card and return a payment token, or throw a CardError naming the
 * field that's wrong ('number', 'expiry' or 'cvc').
 * expiry is "MM/YY"; a card is valid until the end of its expiry month.
 */
export function createToken({ number, expiry, cvc }, now = new Date()) {
  const digits = String(number ?? '').replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(digits) || !luhnValid(digits)) throw new CardError('card number is invalid', 'number');

  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(String(expiry ?? '').trim());
  const month = match && Number(match[1]);
  if (!match || month < 1 || month > 12) throw new CardError('expiry must be MM/YY', 'expiry');
  const endOfMonth = new Date(2000 + Number(match[2]), month, 1); // first moment of the next month
  if (now >= endOfMonth) throw new CardError('card has expired', 'expiry');

  if (!/^\d{3}$/.test(String(cvc ?? ''))) throw new CardError('security code must be 3 digits', 'cvc');

  const token = TEST_CARDS[digits];
  if (!token) throw new CardError('unknown card: use one of the Demo Pay test cards', 'number');
  return token;
}
