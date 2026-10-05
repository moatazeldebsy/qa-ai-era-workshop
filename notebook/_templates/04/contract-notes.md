# Integration and contract testing notes

Topic 4. Replace every ✏️.

## Step 1 — The shop's own contract

Endpoints the shop serves that `app/openapi.yaml` doesn't document: ✏️

Why a 500 for a client's broken JSON is worse than "just the wrong number": ✏️

## Step 2 — The integration bug

What the shop stored as the order's `reservationId`, and why: ✏️

Why did Topic 3's checkout tests, with their fake inventory, never see this? ✏️

## Step 3 — Who was right?

The consumer expected ✏️, the provider sends ✏️. I changed ✏️ because ✏️

## Step 4 — Breaking-change drill

| Provider change | Verification result | Why |
|---|---|---|
| Remove `expiresAt` from the reservation response | ✏️ | ✏️ |
| Rename `reservationId` to `reservation_id` | ✏️ | ✏️ |

What this tells me about which provider changes are safe: ✏️
