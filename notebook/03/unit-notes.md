# Unit and component testing notes

Topic 3. Reference answer.

## Step 1 — Smells in `smelly.test.js`

| Test | Smell(s) I see | What could go wrong because of it |
|---|---|---|
| `test1` | Obscure name; weak assertion (`assert.ok`); mutates shared state | Passes for any output; silently changes what the next test sees |
| `cart works` | Eager test; interacting tests; silent catch | Fails when run alone or reordered; passes if out-of-stock books stop throwing |
| `shipping` | Conditional logic in the test | A failure doesn't say which quantity broke; easy to assert the wrong branch |
| `orders` | Meaningless assertion (`.length === 9`) | Passes for any 9-letter state, and readers can't tell what's being checked |
| `new year` | Mystery guest (the real clock); tests nothing in the product | Noise in the suite; would break in a test environment with a fake or old clock |

The two tests I rewrote in `clean.test.js`, and what I changed: `cart works` became two tests (the total for 29.99 + 34.00, and the out-of-stock rejection with `assert.throws`); `shipping` became two tests, one per quantity, with no `if`. No test shares state.

## Step 3 — Doubles

Which double did each collaborator get in `checkout.test.js` (fake, stub, spy, mock), and why that one? Inventory is a **fake**: its behaviour (reserve, release, stock levels) matters to the tests. Payments is a **stub**: we only need it to approve or decline. The mailer is a **spy**: sending an email is an outgoing command, so we check afterwards what was sent.

What happens to a customer today when the confirmation email fails, and why is that wrong? `placeOrder` rejects after the card was charged, so the customer sees an error for an order they've paid for, and is likely to pay again.

## Step 5 — Coverage versus mutation score

Line coverage of `checkout.js` and `returns.js` before I added tests: 100% lines and 100% branches for both.

Mutation score before and after: 82.05% before (7 survivors); 94.1% after (3 survivors).

One surviving mutant I chose *not* to kill, and why it isn't worth a test: `newId = () => undefined`. Every test injects its own id generator, so the default is never exercised; production would show a missing id immediately in the first order. On a Berlin-time laptop, the `timeZone` option mutant also survives, because local time *is* Berlin time there; CI runs in UTC and kills it.
