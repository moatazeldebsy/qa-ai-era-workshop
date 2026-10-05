import crypto from 'node:crypto';
import { ValidationError } from './cart.js';

// Customer accounts and sign-in sessions, kept in memory like the orders (a
// restart forgets them). The clock and the session lifetime are injected, so
// a test can expire a session without waiting two hours.
//
//   register({ name, email, password }) → { user, token }   throws ValidationError | AccountError
//   login({ email, password })          → { user, token }   throws ValidationError | AccountError
//   logout(token)
//   userForSession(token)               → user | undefined
//
// A user is { id, name, email }. Password hashes never leave this module.

export class AccountError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// A test account, obviously fake, so labs and demos can sign in straight away.
export const TEST_ACCOUNT = { name: 'Ada Lovelace', email: 'ada@example.com', password: 'quality-books-demo' };

const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// The same message whether the email or the password is wrong, so the login
// form can't be used to find out who has an account.
const BAD_LOGIN = 'email or password is incorrect';

export function createAccounts({ clock = () => new Date(), sessionTtlMs = SESSION_TTL_MS, seed = [TEST_ACCOUNT] } = {}) {
  const users = new Map(); // email -> { id, name, email, salt, hash }
  const sessions = new Map(); // token -> { email, expiresAt }

  function startSession(email) {
    const token = crypto.randomBytes(32).toString('base64url');
    sessions.set(token, { email, expiresAt: clock().getTime() + sessionTtlMs });
    return { user: publicUser(users.get(email)), token };
  }

  function register({ name, email, password } = {}) {
    const cleanName = typeof name === 'string' ? name.trim() : '';
    if (cleanName.length < 1 || cleanName.length > 80) throw new ValidationError('name must be 1 to 80 characters');
    const cleanEmail = normaliseEmail(email);
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      throw new ValidationError('password must be 8 to 128 characters');
    }
    if (users.has(cleanEmail)) throw new AccountError('an account with this email already exists', 409);
    const salt = crypto.randomBytes(16);
    users.set(cleanEmail, { id: crypto.randomUUID(), name: cleanName, email: cleanEmail, salt, hash: hashPassword(password, salt) });
    return startSession(cleanEmail);
  }

  function login({ email, password } = {}) {
    if (typeof email !== 'string' || typeof password !== 'string') throw new ValidationError('email and password are required');
    const user = users.get(email.trim().toLowerCase());
    if (!user || !crypto.timingSafeEqual(hashPassword(password, user.salt), user.hash)) {
      throw new AccountError(BAD_LOGIN, 401);
    }
    return startSession(user.email);
  }

  function userForSession(token) {
    const session = token && sessions.get(token);
    if (!session) return undefined;
    if (clock().getTime() >= session.expiresAt) {
      sessions.delete(token);
      return undefined;
    }
    return publicUser(users.get(session.email));
  }

  for (const account of seed) register(account);

  return { register, login, logout: (token) => sessions.delete(token), userForSession };
}

function normaliseEmail(email) {
  const clean = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (clean.length > 254 || !EMAIL.test(clean)) throw new ValidationError('email must be a valid email address');
  return clean;
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 32);
}

function publicUser({ id, name, email }) {
  return { id, name, email };
}
