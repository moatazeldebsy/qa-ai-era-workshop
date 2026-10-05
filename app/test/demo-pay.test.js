import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createToken, luhnValid, CardError } from '../public/demo-pay.js';

// The pretend payment provider runs in the browser, but it's plain JavaScript,
// so its rules are unit-tested here.

const now = new Date('2026-06-15T12:00:00Z');
const card = { number: '4242 4242 4242 4242', expiry: '12/30', cvc: '123' };
const fieldOf = (input) => {
  try {
    createToken(input, now);
  } catch (err) {
    assert.ok(err instanceof CardError);
    return [err.field, err.message];
  }
};

test('test cards map to their tokens, with or without spaces and dashes', () => {
  assert.equal(createToken(card, now), 'tok_visa');
  assert.equal(createToken({ ...card, number: '4000-0000-0000-0002' }, now), 'tok_declined');
  assert.equal(createToken({ ...card, number: '4000000000009995' }, now), 'tok_insufficient_funds');
});

test('the Luhn checksum catches a mistyped digit', () => {
  assert.equal(luhnValid('4242424242424242'), true);
  assert.equal(luhnValid('4242424242424241'), false);
  assert.deepEqual(fieldOf({ ...card, number: '4242 4242 4242 4241' }), ['number', 'card number is invalid']);
});

test('a valid number that is not a test card is refused', () => {
  assert.equal(fieldOf({ ...card, number: '5555 5555 5555 4444' })[0], 'number');
});

test('a card is valid until the end of its expiry month', () => {
  assert.equal(createToken({ ...card, expiry: '06/26' }, now), 'tok_visa');
  assert.deepEqual(fieldOf({ ...card, expiry: '05/26' }), ['expiry', 'card has expired']);
  assert.deepEqual(fieldOf({ ...card, expiry: '13/30' }), ['expiry', 'expiry must be MM/YY']);
  assert.deepEqual(fieldOf({ ...card, expiry: '1230' }), ['expiry', 'expiry must be MM/YY']);
});

test('the security code is 3 digits', () => {
  for (const cvc of ['12', '1234', 'abc', '']) assert.equal(fieldOf({ ...card, cvc })[0], 'cvc', cvc);
});
