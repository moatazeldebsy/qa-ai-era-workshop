#!/usr/bin/env node
// npm run contract:verify — the inventory team's side of the contract.
//
// Replays every interaction in the shop's contract file against the REAL
// inventory service, after putting it into the state each interaction
// expects ("provider states"). Run `npm run contract:test` first: it
// writes the contract file. In a real setup the shop's CI publishes the file
// to a Pact Broker, and the inventory team's CI fetches and verifies it.
import fs from 'node:fs';
import path from 'node:path';
import './no-telemetry.js';
import { Verifier } from '@pact-foundation/pact';
import { createInventoryApp } from '../../services/inventory/src/app.js';

const pactFile = path.resolve('labs/04-integration-contract/pacts/quality-books-shop-inventory-service.json');
if (!fs.existsSync(pactFile)) {
  console.error('✖ No contract file yet. Run the consumer tests first:  npm run contract:test');
  process.exit(1);
}

const app = createInventoryApp();
const server = await new Promise((resolve) => {
  const s = app.listen(0, '127.0.0.1', () => resolve(s));
});

const stateHandlers = {
  'book 1 has 12 copies in stock': async () => app.locals.reset(),
  'book 5 has 3 copies in stock': async () => app.locals.reset(),
  'reservation res-1 exists': async () => {
    app.locals.reset();
    app.locals.reservations().set('res-1', { lines: [{ bookId: 1, quantity: 2 }], expiresAt: new Date().toISOString() });
  },
};

let ok = true;
try {
  await new Verifier({
    provider: 'inventory-service',
    providerBaseUrl: `http://127.0.0.1:${server.address().port}`,
    pactUrls: [pactFile],
    stateHandlers,
    logLevel: 'error',
  }).verifyProvider();
  console.log('\n✔ The inventory service honours every interaction the shop relies on.');
} catch {
  ok = false;
  console.log('\n✖ The inventory service does not honour the shop\'s contract. Read the mismatches above.');
} finally {
  server.close();
}
process.exit(ok ? 0 : 1);
