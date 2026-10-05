# Bug hunt: why each test caught the bug, or didn't

Topic 1, lab step 5. Run `npm run foundations:bug-hunt`, then explain each result in one or two sentences.

| Test | Caught it? | Why |
|---|---|---|
| 49.99 / 50.00 / 50.01 boundary tests | ✏️ | ✏️ |
| a 2 x 29.99 cart (59.98 EUR) ships free | ✏️ | ✏️ |
| every sellable cart obeys the pricing invariants | ✏️ | ✏️ |
| the consistency tests (contract, policy) | ✏️ | ✏️ |

Coverage of `cart.js` was high on both runs. What does that tell you about coverage as a measure? ✏️

At which other levels (unit, API, E2E) did the bug show up, and how long did each take to tell you? ✏️
