import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAccounts, AccountError, TEST_ACCOUNT } from '../src/accounts.js';
import { ValidationError } from '../src/cart.js';

const grace = { name: 'Grace Hopper', email: 'grace@example.com', password: 'correct-horse' };

test('registering signs the customer in', () => {
  const accounts = createAccounts({ seed: [] });
  const { user, token } = accounts.register(grace);
  assert.deepEqual(Object.keys(user).sort(), ['email', 'id', 'name']);
  assert.deepEqual(accounts.userForSession(token), user);
});

test('emails are case-insensitive and unique', () => {
  const accounts = createAccounts({ seed: [] });
  accounts.register(grace);
  assert.throws(() => accounts.register({ ...grace, email: ' GRACE@example.com ' }), (err) => err instanceof AccountError && err.status === 409);
  assert.ok(accounts.login({ email: 'Grace@Example.com', password: grace.password }).token);
});

test('rejects invalid registrations', () => {
  const accounts = createAccounts({ seed: [] });
  for (const bad of [{ ...grace, name: ' ' }, { ...grace, email: 'grace' }, { ...grace, password: 'seven77' }, {}]) {
    assert.throws(() => accounts.register(bad), ValidationError, JSON.stringify(bad));
  }
});

test('a wrong password and an unknown email get the same answer', () => {
  const accounts = createAccounts();
  const attempt = (email, password) => {
    try {
      accounts.login({ email, password });
    } catch (err) {
      return [err.constructor, err.status, err.message];
    }
  };
  assert.deepEqual(attempt(TEST_ACCOUNT.email, 'wrong-password'), attempt('nobody@example.com', 'wrong-password'));
  assert.deepEqual(attempt(TEST_ACCOUNT.email, 'wrong-password'), [AccountError, 401, 'email or password is incorrect']);
});

test('the seeded test account can sign in', () => {
  const { user } = createAccounts().login(TEST_ACCOUNT);
  assert.equal(user.email, 'ada@example.com');
});

test('sessions end at logout and after their lifetime', () => {
  let now = new Date('2026-06-01T10:00:00Z');
  const accounts = createAccounts({ clock: () => now, sessionTtlMs: 60_000 });
  const first = accounts.login(TEST_ACCOUNT).token;
  accounts.logout(first);
  assert.equal(accounts.userForSession(first), undefined);

  const second = accounts.login(TEST_ACCOUNT).token;
  now = new Date('2026-06-01T10:00:59Z');
  assert.ok(accounts.userForSession(second));
  now = new Date('2026-06-01T10:01:00Z');
  assert.equal(accounts.userForSession(second), undefined);
});

test('unknown or missing session tokens are guests', () => {
  const accounts = createAccounts();
  assert.equal(accounts.userForSession(undefined), undefined);
  assert.equal(accounts.userForSession('not-a-token'), undefined);
});
