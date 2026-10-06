# Topic 4 · Lab

## 14. Hands-on lab: making two services agree

You'll check the shop's API against its own contract and fix how it answers client mistakes, wire the shop to the real inventory service and find a bug that no unit test could see, catch the same bug with a Pact contract, and run a breaking-change drill as the inventory team.

**Time:** 2.5 hours

!!! abstract "Same routine as before"
    `npm run learn:start 4` for your branch · try each step before opening the folded hints (▸) · `npm run learn:check 4` to see what's left · thinking work goes in `notebook/04/contract-notes.md`.

**Files:**

| File | What's in it |
|---|---|
| `services/inventory/src/app.js` | The inventory service (the provider), owned by "another team" |
| `services/inventory/openapi.yaml` | The inventory service's published API |
| `app/src/inventory-client.js` | The shop's HTTP client for the inventory service (the consumer side) |
| `app/src/server.js` | The shop, now with `POST /api/orders`, `GET /api/orders/:id` and `POST /api/orders/:id/cancel` |
| `labs/04-integration-contract/tests/api.test.js` | In-process API tests, every response validated against `app/openapi.yaml` |
| `labs/04-integration-contract/tests/integration.test.js` | Shop + real inventory service, over HTTP |
| `labs/04-integration-contract/tests/inventory.consumer.test.js` | Pact consumer tests: what the shop needs from the inventory service |
| `labs/04-integration-contract/verify-provider.mjs` | Pact provider verification: replays the contract against the real inventory service |
| `labs/04-integration-contract/api/` | The same kind of API checks with Playwright, out of process (optional) |

### Step 0 — Baseline

```bash
npm ci                            # adds Pact, Ajv and yaml if you're coming from Topic 3
npm run learn:start 4
mkdir -p notebook/04 && cp notebook/_templates/04/contract-notes.md notebook/04/
npm run contract:test
```

```text title="Expected output (summary)"
ℹ tests 18
ℹ suites 4
ℹ pass 16
ℹ fail 0
ℹ todo 2
```

Two TODOs, two real bugs. Running the consumer tests also wrote a contract file to `labs/04-integration-contract/pacts/`. Open it: it's plain JSON describing every request the shop sends to the inventory service, and the minimum it expects back.

Want to see the two services running? `npm run start:all` starts both (shop on 3210, inventory on 3220). Then try:

```bash
curl -s localhost:3210/api/orders -H 'content-type: application/json' \
  -d '{"items":[{"bookId":1,"quantity":2}],"paymentToken":"tok_visa","customer":{"email":"ada@example.com"}}'
curl -s localhost:3220/stock/1
```

### Step 1 — The shop's own contract (30 min)

Read `api.test.js`. Each response is checked twice: for the values that matter, and against the schema in `app/openapi.yaml` (via `openApiContract()` in `helpers.js`).

**Your task (10 min):** clients have bugs too. Using `curl` against `npm start`, or a scratch test, send the shop requests a buggy client might send: broken JSON, the wrong types, missing fields, huge bodies. Which answers would mislead a client, or the shop's own on-call engineer?

??? tip "Hint"
    `curl -s -w ' %{http_code}\n' localhost:3210/api/cart/price -H 'content-type: application/json' -d '{"items": ['`

??? success "Reveal"
    Broken JSON gets `500 {"error":"internal error"}`, and so does a 20 KB body. Express already knows these are the client's fault: it raises errors with `err.status` 400 and 413. The shop's catch-all error handler ignores that and answers 500. The TODO test in `api.test.js` records it.

Fix the error handler at the bottom of `createApp` in `app/src/server.js`: keep a 4xx status that Express set, with a short `error` message, and keep the 500 for everything else. Then turn the TODO into a real test.

??? tip "Hint"
    `err.status` is 400 for a JSON parse error and 413 for a body over the limit. `err.type` tells them apart (`'entity.parse.failed'`, `'entity.too.large'`).

??? success "Reference solution"
    ```js
    app.use((err, _req, res, _next) => {
      if (err.status >= 400 && err.status < 500) {
        return res.status(err.status).json({ error: err.type === 'entity.too.large' ? 'request body too large' : 'request body is not valid JSON' });
      }
      console.error(JSON.stringify({ level: 'error', message: err.message }));
      res.status(500).json({ error: 'internal error' });
    });
    ```

While you're here, compare the routes in `server.js` with the paths in `app/openapi.yaml`. Note in your notebook which endpoints the contract doesn't document.

### Step 2 — Two real services (30 min)

Read `integration.test.js`. It starts the **real** inventory service and the **real** shop, each on a random port, and checks the inventory service's stock, not just the shop's answers. Run it and read the TODO's failure:

```bash
node --test --test-reporter=spec labs/04-integration-contract/tests/integration.test.js
```

```text title="Expected output (excerpt)"
✖ cancelling an order gives its stock back to the inventory service # real bug: ...
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  10 !== 12
```

The shop says the order is cancelled. The inventory service still holds the two books.

**Your task:** find out why, without changing any code yet. Place an order with `npm run start:all` and `curl`, then `curl localhost:3210/api/orders/<id>`. What is the order's `reservationId`? Read `inventory-client.js` and `services/inventory/openapi.yaml`. Write your explanation in the notebook, including why Topic 3's checkout tests never saw it.

??? tip "Hint"
    The order JSON has no `reservationId` at all. `JSON.stringify` drops `undefined` values. Where did `undefined` come from?

??? success "Reveal"
    The client returns `body.id`; the inventory service sends `reservationId`. So `reserve()` returns `undefined`, the order stores it, and cancelling calls `DELETE /reservations/undefined`. The inventory service answers 404, which the client treats as "already released" (a reasonable rule, which hides the bug). Topic 3's fake inventory returned its own ids and never used the real client, so the mismatch was invisible.

Don't fix it yet. Step 3 shows how a contract catches it, so it can never come back.

### Step 3 — Catch it with a contract (35 min)

The consumer tests passed in step 0. Now run the provider's half:

```bash
npm run contract:verify
```

```text title="Expected output (excerpt)"
  a request to reserve 2 copies of book 1
     Given book 1 has 12 copies in stock
    returns a response which
      has status code 201 (OK)
      has a matching body (FAILED)

Failures:

1) Verifying a pact between quality-books-shop and inventory-service Given book 1 has 12 copies in stock - a request to reserve 2 copies of book 1
    1.1) has a matching body
           $ -> Actual map is missing the following keys: id

✖ The inventory service does not honour the shop's contract. Read the mismatches above.
```

The consumer test was green because it encoded the shop's own wrong assumption, and Pact's mock provider answered accordingly. Verification replays the same request against the **real** provider, and the mismatch appears. Nobody had to run the two services together.

**Your task:** decide which side is wrong, then fix it.

??? tip "Hint"
    Which document is the published API, the one other consumers may rely on too?

??? success "Reference solution"
    The inventory service's `openapi.yaml` publishes `reservationId`, so the consumer is wrong. In `app/src/inventory-client.js`:

    ```js
    return body.reservationId;
    ```

    In `inventory.consumer.test.js`, the expectation becomes:

    ```js
    .jsonBody({ reservationId: like('res-1') })
    ```

Re-run both halves, then the integration tests:

```bash
npm run contract:test && npm run contract:verify
```

```text title="Expected output (summary)"
✔ The inventory service honours every interaction the shop relies on.
```

The integration TODO now passes. Turn it into a real test. Write down in your notebook what you changed and why.

### Step 4 — Breaking-change drill (20 min)

You're now on the inventory team. Make each change below in `services/inventory/src/app.js`, run `npm run contract:verify`, record the result in your notebook, then **undo the change**.

1. Remove `expiresAt` from the `POST /reservations` response. (The shop doesn't use it.)
2. Rename `reservationId` to `reservation_id` in the response.

??? success "Compare your results"
    1. Removing `expiresAt`: **verification passes.** No consumer declared it, so the contract says it's safe. An OpenAPI diff would flag it as breaking, because it can't know nobody uses it.
    2. Renaming `reservationId`: **verification fails** with `missing the following keys: reservationId`. In a real setup, `can-i-deploy` would block this release of the inventory service until the shop moved to the new name. Expand-and-contract (send both names for a while) is the way through.

Optionally, see the same API from outside with Playwright: `npm run test:api` (starts the shop, 24 tests in `labs/04-integration-contract/api/`).

## 15. Verify and troubleshoot

### Definition of done

```bash
npm run learn:check 4
```

```text title="Expected output"
✔ Step 1 — Client mistakes get 4xx answers, never 500
    malformed and oversized bodies answered 400 and 413 on every JSON route
✔ Step 2-3 — The contract is honoured and the integration bug is fixed
    consumer tests, provider verification and the real integration all agree
✔ Step 4 — Notes: the contract, the bug, and the breaking-change drill
    notebook/04/contract-notes.md

3/3 steps done for Topic 4: Integration, API, and Contract Testing
🎉 Lab complete. Next: the quiz and the challenge on the topic page.
```

Commit and push to your fork when you're done.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Cannot find package '@pact-foundation/pact'` (or `ajv`, `yaml`) | Dependencies installed before Topic 4 | `npm ci` |
| `contract:verify`: `No contract file yet` | The consumer tests haven't run since a clean checkout | `npm run contract:test` first; it writes `labs/04-integration-contract/pacts/` |
| Verification still fails after your fix | The contract file is stale | Re-run `npm run contract:test`, then verify again |
| Consumer test: `Request was not matched` | The client sent something the interaction doesn't describe | Read the mismatch: method, path, headers and body must match the interaction |
| Pact native library errors on install | An unsupported platform or a blocked download of Pact's binaries | Use Codespaces, or check `npm ci` output for the Pact download error |
| `EADDRINUSE` with `npm run start:all` | Something already uses port 3210 or 3220 | Stop it, or set `PORT` / `INVENTORY_PORT` |
| Orders return `503 inventory service unavailable` | Only the shop is running | `npm run start:all`, not `npm start` |
| Step 1 fix breaks other tests | Every error became a 4xx | Only keep the status when `err.status` is between 400 and 499; everything else stays 500 |
| Integration test passes but `learn:check` step 2-3 fails | The contract file still expects `id` | Update the consumer test's `jsonBody`, then re-run `contract:test` |
