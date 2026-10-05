# Bug hunt: why each test caught the bug, or didn't

Topic 1, lab step 5. Reference answer.

| Test | Caught it? | Why |
|---|---|---|
| 49.99 / 50.00 / 50.01 boundary tests | No | They call `shippingFor()` directly, and it's still correct; the bug is in what `priceCart` passes to it |
| a 2 x 29.99 cart (59.98 EUR) ships free | Yes | With quantity 2, the subtotal (59.98) and the single-copy price (29.99) fall on opposite sides of 50 |
| every sellable cart obeys the pricing invariants | Yes | It checks ~19,000 carts, so it doesn't rely on anyone guessing the triggering input |
| the consistency tests (contract, policy) | No | The documents still agree with each other; the bug is in behaviour, not in the spec |

Coverage of `cart.js` was high on both runs. What does that tell you about coverage as a measure? Coverage shows which code ran, not whether anything checked its result. High coverage is necessary, but it can't tell you whether your tests would notice a bug; planting bugs can.

At which other levels (unit, API, E2E) did the bug show up, and how long did each take to tell you? Unit (bug hunt): about 0.1 s per run. API: 3 cart rows failed in about 2 s, plus app start-up. E2E: the free-shipping UI test failed after about 5 s. Same bug, roughly 50× slower feedback at the top.
