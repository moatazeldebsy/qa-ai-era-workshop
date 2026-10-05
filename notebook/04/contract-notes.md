# Integration and contract testing notes

Topic 4. Reference answer.

## Step 1 — The shop's own contract

Endpoints the shop serves that `app/openapi.yaml` doesn't document: `GET /health`, `GET /metrics`, `GET /api/recommendations`, `POST /api/orders`, `GET /api/orders/{id}` and `POST /api/orders/{id}/cancel`.

Why a 500 for a client's broken JSON is worse than "just the wrong number": a 5xx tells the client the server failed and it may retry, so a buggy client retries forever; it also counts towards the shop's error rate and alerts, paging an engineer for someone else's mistake. And it isn't a documented response, so client authors can't handle it on purpose.

## Step 2 — The integration bug

What the shop stored as the order's `reservationId`, and why: nothing; it was `undefined`, so `JSON.stringify` left it out. The client returns `body.id`, but the inventory service's response has `reservationId`.

Why did Topic 3's checkout tests, with their fake inventory, never see this? The fake replaced both the HTTP client and the service, and returned its own ids. The real client, where the wrong field name lived, never ran in those tests.

## Step 3 — Who was right?

The consumer expected `id`, the provider sends `reservationId`. I changed the client (`inventory-client.js`) and the consumer test's expected body because the provider's `openapi.yaml` is the published API: other consumers may already depend on `reservationId`, so changing the provider would break them.

## Step 4 — Breaking-change drill

| Provider change | Verification result | Why |
|---|---|---|
| Remove `expiresAt` from the reservation response | Passes | The shop's contract never mentions `expiresAt`, because the shop doesn't use it |
| Rename `reservationId` to `reservation_id` | Fails: missing key `reservationId` | The shop declared it needs `reservationId` |

What this tells me about which provider changes are safe: a change is safe when no consumer's contract depends on what it changes. A consumer-driven contract can prove that; an OpenAPI diff can only say a field changed, not whether anyone uses it.
