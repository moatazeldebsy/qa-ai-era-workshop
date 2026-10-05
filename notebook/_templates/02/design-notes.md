# Test design notes

Topic 2. One section per lab step; replace every ✏️.

## Step 1 — Partitions for `quantity` (from the API contract only)

| Partition | Example values | Expected | My test value |
|---|---|---|---|
| ✏️ | ✏️ | ✏️ | ✏️ |
| ✏️ | ✏️ | ✏️ | ✏️ |
| ✏️ | ✏️ | ✏️ | ✏️ |
| ✏️ | ✏️ | ✏️ | ✏️ |

What did I miss compared with `partitions.test.js`? ✏️

## Step 1 — Partitions for `bookId`

Partitions the contract (`type: integer`) creates: ✏️

`"3"` is accepted. Bug or feature, and why? ✏️

## Step 2 — The missing routing column

When a question is off-topic **and** mentions shipping, the code answers: ✏️

It should answer: ✏️ because ✏️

## Step 3 — State × event table

| state \ event | pay | ship | deliver | cancel | refund |
|---|---|---|---|---|---|
| placed | ✏️ | ✏️ | ✏️ | ✏️ | ✏️ |
| paid | ✏️ | ✏️ | ✏️ | ✏️ | ✏️ |
| shipped | ✏️ | ✏️ | ✏️ | ✏️ | ✏️ |
| delivered | ✏️ | ✏️ | ✏️ | ✏️ | ✏️ |
| cancelled | ✏️ | ✏️ | ✏️ | ✏️ | ✏️ |
| refunded | ✏️ | ✏️ | ✏️ | ✏️ | ✏️ |

Number of invalid (✗) cells: ✏️

## Step 5 — The riskiest configuration triple I would seed

✏️ because ✏️
