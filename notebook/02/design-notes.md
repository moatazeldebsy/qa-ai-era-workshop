# Test design notes

Topic 2. Reference answer.

## Step 1 — Partitions for `quantity` (from the API contract only)

| Partition | Example values | Expected | My test value |
|---|---|---|---|
| Below the minimum | …, -1, 0 | 400, "integer from 1 to 10" | 0 |
| Valid | 1 … 10 | 200 (if in stock) | 1, 5, 10 |
| Above the maximum | 11, 12, … | 400, "integer from 1 to 10" | 11 |
| Not an integer | 1.5, "2", null | 400 | 1.5 |

What did I miss compared with `partitions.test.js`? I forgot `null` and the string `"2"`, and I didn't think of the *stock* boundary as its own partition (3 vs 4 copies of book 5).

## Step 1 — Partitions for `bookId`

Partitions the contract (`type: integer`) creates: known integer ids, unknown integer ids (0, 42), non-integers (1.5), and non-numbers (`"3"`, `"abc"`, `null`).

`"3"` is accepted. Bug or feature, and why? A bug against the contract. Being lenient means a client sending strings works today but breaks the day validation is tightened, and other implementations of the contract (a mock server, a mobile client's tests) will disagree with the real API. I'd reject it with a 400 and say so in the changelog.

## Step 2 — The missing routing column

When a question is off-topic **and** mentions shipping, the code answers: the off-topic refusal ("I can only help with questions about Quality Books…"), because the off-topic check runs first.

It should answer: the shipping policy, because a question that mentions delivery or shipping is about the shop even if it also mentions the weather. Shop keywords should beat off-topic keywords; injection attempts should still beat everything.

## Step 3 — State × event table

| state \ event | pay | ship | deliver | cancel | refund |
|---|---|---|---|---|---|
| placed | paid | ✗ | ✗ | cancelled | ✗ |
| paid | ✗ | shipped | ✗ | cancelled | ✗ |
| shipped | ✗ | ✗ | delivered | ✗ | ✗ |
| delivered | ✗ | ✗ | ✗ | ✗ | refunded (if the claim is accepted) |
| cancelled | ✗ | ✗ | ✗ | ✗ | ✗ |
| refunded | ✗ | ✗ | ✗ | ✗ | ✗ |

Number of invalid (✗) cells: 24

## Step 5 — The riskiest configuration triple I would seed

webkit + mobile + ar-EG, because Safari on iPhone is a large share of real mobile traffic, right-to-left layout is the least tested, and the smallest screen leaves no room for layout mistakes. I'd also run it on slow-3g once a release.
