// The shop's client for the inventory service (services/inventory). It
// implements the interface the checkout expects (Topic 3):
//
//   reserve(lines) → reservationId     release(reservationId)
//
// `fetch` is injectable, but the tests in Topic 4 don't need that: they run
// the client against a Pact mock server or a real inventory service.

import { currentRequestId } from './request-context.js';

// Forward the id of the request being handled, so both services log it.
const withRequestId = (options = {}) => {
  const id = currentRequestId();
  return id ? { ...options, headers: { ...(options.headers ?? {}), 'x-request-id': id } } : options;
};

export class InventoryError extends Error {
  constructor(message, { status, bookId } = {}) {
    super(message);
    this.status = status;
    this.bookId = bookId;
  }
}

export function createInventoryClient({ baseUrl, fetch: rawFetch = globalThis.fetch, timeoutMs = 1000, token }) {
  // Network failures (refused, reset, DNS) and calls slower than timeoutMs
  // become InventoryErrors, so callers handle "the inventory service is
  // unavailable" in one place, and a slow dependency can't make us hang.
  const http = async (url, options) => {
    try {
      return await rawFetch(url, { ...withRequestId(options), signal: AbortSignal.timeout(timeoutMs) });
    } catch (err) {
      throw new InventoryError(`inventory service unreachable: ${err.cause?.code ?? err.message}`);
    }
  };

  // The inventory service only trusts callers that present the shared token.
  const auth = token ? { authorization: `Bearer ${token}` } : {};

  return {
    async reserve(lines) {
      const res = await http(`${baseUrl}/reservations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...auth },
        body: JSON.stringify({ lines }),
      });
      if (res.status === 409) {
        const body = await res.json();
        throw new InventoryError(`not enough stock of book ${body.bookId}`, { status: 409, bookId: body.bookId });
      }
      if (!res.ok) throw new InventoryError(`inventory service answered ${res.status}`, { status: res.status });
      const body = await res.json();
      return body.reservationId;
    },

    async release(reservationId) {
      const res = await http(`${baseUrl}/reservations/${reservationId}`, { method: 'DELETE', headers: auth });
      // 404 means already released or expired: releasing is idempotent.
      if (res.status !== 204 && res.status !== 404) {
        throw new InventoryError(`inventory service answered ${res.status}`, { status: res.status });
      }
    },
  };
}
