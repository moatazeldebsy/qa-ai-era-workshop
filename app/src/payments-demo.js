import crypto from 'node:crypto';

// A stand-in payment provider for the demo shop. Tokens, never card numbers:
//   tok_visa      approves
//   tok_declined  declines
// Anything else is rejected as an unknown token.
export const demoPayments = {
  async charge({ amount, token }) {
    if (token === 'tok_declined') throw new Error('card declined');
    if (token !== 'tok_visa') throw new Error('unknown payment token');
    return { id: `pay-${crypto.randomUUID()}`, amount };
  },
};
