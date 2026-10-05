# Exploration charter — free shipping

Learning Path, Topic 1, lab step 2. Copy this file, fill in the notes as you go.

**Explore** the free-shipping rule
**with** the shop UI, the API (`curl`), the AI assistant, and `app/openapi.yaml`
**to discover** where customers could get different answers about whether they pay shipping.

**Timebox:** 20 minutes. **Build:** `npm start` (default modes).

## Ideas to try

- Carts just under and just over 50 EUR. What is the closest you can get to exactly 50.00?
- Ask the assistant: *"Is shipping free?"* and *"Is shipping free on a 50 EUR order?"*
- Read the `/api/cart/price` description in `app/openapi.yaml`.
- Out-of-stock books, 10+ copies, an empty cart, an unknown book id.
- Restart with `npm run start:bug-cart` and repeat the 2 × *Testing in Production* cart.

## Notes

| Time | What I did | What I saw | Question / bug / idea |
|---|---|---|---|
| | | | |

## Findings

| # | Type (bug / question / risk / testability) | Summary | Evidence |
|---|---|---|---|
| | | | |

## Debrief

- What did I cover? What did I **not** cover?
- Which finding would I raise first, and to whom?
- Which finding should become an automated check, and at which layer?
