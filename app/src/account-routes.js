import express from 'express';
import { ValidationError } from './cart.js';
import { AccountError } from './accounts.js';

// The HTTP side of accounts: sign-in sessions in a cookie, and the signed-in
// customer's order history. Guests can still order without an account; an
// order placed while signed in is linked to the customer.
//
//   POST /api/auth/register { name, email, password } → 201 { user } + cookie | 400 | 409
//   POST /api/auth/login    { email, password }       → 200 { user } + cookie | 400 | 401
//   POST /api/auth/logout                             → 204, cookie cleared
//   GET  /api/auth/me                                 → 200 { user }, user null for a guest
//   GET  /api/account/orders                          → 200 { orders } newest first | 401

export const SESSION_COOKIE = 'qb_session';
const SESSION_MAX_AGE_S = 2 * 60 * 60;

// HttpOnly: page scripts can't read it. SameSite=Strict: other sites can't
// make the browser send it, which is the shop's CSRF protection.
const cookie = (value, maxAge) => `${SESSION_COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`;

function sessionToken(req) {
  for (const part of (req.get('cookie') ?? '').split(';')) {
    const [name, ...value] = part.trim().split('=');
    if (name === SESSION_COOKIE) return value.join('=');
  }
  return undefined;
}

/** Middleware: sets req.user when the request carries a live session. */
export function sessionUser(accounts) {
  return (req, _res, next) => {
    req.user = accounts.userForSession(sessionToken(req));
    next();
  };
}

/** The optional shipping address of an order, checked before anything is charged. */
export function parseShipTo(shipTo) {
  if (shipTo === undefined) return undefined;
  const fields = ['name', 'street', 'city', 'postcode', 'country'];
  const valid =
    shipTo !== null &&
    typeof shipTo === 'object' &&
    fields.every((f) => typeof shipTo[f] === 'string' && shipTo[f].trim().length > 0 && shipTo[f].length <= 100);
  if (!valid) throw new ValidationError(`shipTo needs ${fields.join(', ')} (1 to 100 characters each)`);
  return Object.fromEntries(fields.map((f) => [f, shipTo[f].trim()]));
}

export function accountRoutes({ accounts, orders }) {
  const router = express.Router();

  const signIn = (action, status) => (req, res) => {
    try {
      const { user, token } = action(req.body ?? {});
      res.set('set-cookie', cookie(token, SESSION_MAX_AGE_S)).status(status).json({ user });
    } catch (err) {
      if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
      if (err instanceof AccountError) return res.status(err.status).json({ error: err.message });
      throw err;
    }
  };

  router.post('/api/auth/register', signIn(accounts.register, 201));
  router.post('/api/auth/login', signIn(accounts.login, 200));

  router.post('/api/auth/logout', (req, res) => {
    accounts.logout(sessionToken(req));
    res.set('set-cookie', cookie('', 0)).status(204).end();
  });

  // A guest is a normal answer here, not an error: every page asks on load.
  router.get('/api/auth/me', (req, res) => res.json({ user: req.user ?? null }));

  router.get('/api/account/orders', (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'not signed in' });
    const mine = [...orders.values()].filter((o) => o.userId === req.user.id).reverse();
    res.json({ orders: mine });
  });

  return router;
}
