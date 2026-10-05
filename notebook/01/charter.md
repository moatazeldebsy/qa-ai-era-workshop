# Exploration charter — free shipping

Topic 1, lab step 2. Reference answer.

**Explore** the free-shipping rule
**with** the shop UI, the API (`curl`), the AI assistant, and `app/openapi.yaml`
**to discover** where customers could get different answers about whether they pay shipping.

**Timebox:** 20 minutes. **Build:** `npm start` (default modes).

## Notes

| Time | What I did | What I saw | Question / bug / idea |
|---|---|---|---|
| 0:02 | Priced 1 × book 1 (29.99) and 2 × book 1 | 4.90 shipping, then free at 59.98 | As expected |
| 0:05 | Tried to build a 50.00 cart from the catalogue | Closest are 39.90 and 54.00 | Boundary can't be reached; how do we test it? |
| 0:09 | Asked the assistant "Is shipping free on a 50 EUR order?" | "free for orders over 50 EUR" | "Over" reads as > 50 |
| 0:11 | Read `/api/cart/price` in `openapi.yaml` | "free when the subtotal is 50 EUR or more" | Contract says ≥ 50; disagrees with the assistant |
| 0:14 | 11 copies of book 1; 1 copy of book 2 (out of stock) | Clear 400 errors for both | Good messages |
| 0:17 | Restarted with `npm run start:bug-cart`, repeated 2 × book 1 | Shipping 4.9 on a 59.98 cart | Regression: free shipping broken for multi-copy carts |

## Findings

| # | Type (bug / question / risk / testability) | Summary | Evidence |
|---|---|---|---|
| 1 | Question / spec bug | Assistant says free shipping is "over 50 EUR"; contract and code say "50 EUR or more" | `curl` of `/api/assistant`; `openapi.yaml` line 42 |
| 2 | Testability | No sellable cart costs exactly 50.00, so the boundary can't be tested through API or UI | Prices in `catalog.js`; closest totals 39.90 and 54.00 |
| 3 | Bug (planted) | With `BUG_MODE=cart`, 2 × 29.99 = 59.98 is charged 4.90 shipping | Defect report below |

## Defect report

- **Title (impact first):** Customers with several copies of a book are charged shipping on orders over 50 EUR
- **Steps to reproduce:** `npm run start:bug-cart`; `curl -i localhost:3210/api/cart/price -H 'content-type: application/json' -d '{"items":[{"bookId":1,"quantity":2}]}'`
- **Expected:** `subtotal 59.98, shipping 0, total 59.98`
- **Actual:** `subtotal 59.98, shipping 4.9, total 64.88`
- **Evidence (x-request-id, output):** `x-request-id: 3f6c…` (from `curl -i`), response body above
- **Severity / priority:** Major (customers overcharged) / High (affects every multi-copy order over 50 EUR)

## Debrief

- What did I cover? What did I **not** cover? Covered pricing around 50 EUR through API and assistant, and stock errors. Not covered: the browser UI's rendering of shipping, other assistant phrasings, rounding of many lines.
- Which finding would I raise first, and to whom? Finding 3 to the developers (customers overpaid); finding 1 to the product owner (which wording is right).
- Which finding should become an automated check, and at which layer? Finding 1 as a consistency test at unit level; finding 3 as an invariant over every sellable cart, also at unit level.
