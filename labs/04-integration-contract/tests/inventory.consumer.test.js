import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import '../no-telemetry.js';
import { PactV4, MatchersV3 } from '@pact-foundation/pact';
import { createInventoryClient, InventoryError } from '../../../app/src/inventory-client.js';

// Learning Path, Topic 4 — consumer-driven contract tests (Pact).
//
// The shop (consumer) writes down, as executable examples, exactly what it
// needs from the inventory service (provider). Pact runs a mock provider that
// answers as described, and checks the shop's real client against it. The
// result is a contract file in labs/04-integration-contract/pacts/, which the
// provider then verifies against its real code: `npm run contract:verify`.

const { like, regex } = MatchersV3;
const JSON_TYPE = regex('application/json.*', 'application/json');

const pact = new PactV4({
  consumer: 'quality-books-shop',
  provider: 'inventory-service',
  dir: path.resolve('labs/04-integration-contract/pacts'),
  logLevel: 'error',
});

describe('the shop, as a consumer of the inventory service', () => {
  test('reserves stock and gets back a reservation id', async () => {
    await pact
      .addInteraction()
      .given('book 1 has 12 copies in stock')
      .uponReceiving('a request to reserve 2 copies of book 1')
      .withRequest('POST', '/reservations', (req) =>
        req.headers({ 'content-type': 'application/json' }).jsonBody({ lines: [{ bookId: 1, quantity: 2 }] }),
      )
      .willRespondWith(201, (res) => res.headers({ 'content-type': JSON_TYPE }).jsonBody({ reservationId: like('res-1') }))
      .executeTest(async (mock) => {
        const id = await createInventoryClient({ baseUrl: mock.url }).reserve([{ bookId: 1, quantity: 2 }]);
        assert.equal(id, 'res-1');
      });
  });

  test('is told which book is short when there is not enough stock', async () => {
    await pact
      .addInteraction()
      .given('book 5 has 3 copies in stock')
      .uponReceiving('a request to reserve 4 copies of book 5')
      .withRequest('POST', '/reservations', (req) =>
        req.headers({ 'content-type': 'application/json' }).jsonBody({ lines: [{ bookId: 5, quantity: 4 }] }),
      )
      .willRespondWith(409, (res) => res.headers({ 'content-type': JSON_TYPE }).jsonBody({ error: like('insufficient stock'), bookId: 5 }))
      .executeTest(async (mock) => {
        await assert.rejects(
          createInventoryClient({ baseUrl: mock.url }).reserve([{ bookId: 5, quantity: 4 }]),
          (err) => err instanceof InventoryError && err.status === 409 && err.bookId === 5,
        );
      });
  });

  test('releases a reservation', async () => {
    await pact
      .addInteraction()
      .given('reservation res-1 exists')
      .uponReceiving('a request to release reservation res-1')
      .withRequest('DELETE', '/reservations/res-1')
      .willRespondWith(204)
      .executeTest(async (mock) => {
        await createInventoryClient({ baseUrl: mock.url }).release('res-1');
      });
  });
});
