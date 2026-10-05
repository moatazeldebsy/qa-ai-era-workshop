# Test environments and test data notes

Topic 7. Reference answer.

## Step 1 — Three environments

| | In-process tests | `npm run start:all` | Docker Compose |
|---|---|---|---|
| How long to start | Milliseconds | About a second | Seconds (cached build) to a minute (first build) |
| How close to production | Same code, but one process and no network between services | Real processes and HTTP, my laptop's Node and OS | Real images, a container network, production-like configuration |
| Who else can break it | Nobody: each test starts its own | Only me | Only me, and it's thrown away afterwards |

One thing that's different between my laptop and a container, that could make a test pass in one and fail in the other: the time zone and locale (my laptop is in Berlin, the container in UTC), and the Node version if my nvm isn't on the one in `.nvmrc`.

## Step 2 — Shared data

Why the three shared-environment tests pass one at a time and fail together: they all reserve and read book 5. In parallel, one test's reservation changes the stock another test just checked, so each test's assumption ("book 5 has 3 copies") is broken by the others.

Why "reset the data before each test" is not a fix in a shared environment: a reset is another write to the same shared data. If my test resets book 5 while yours is halfway through, I've just broken your test.

Why the test-data API must never be switched on in production: anyone who can reach the service could set stock to any number: sell books that don't exist, or make every book look sold out.

## Step 3 — Realistic data finds bugs

Why the hand-made fixture couldn't find the report bug: all three fixture orders were delivered, so "count every order" and "count orders the shop kept" give the same answer. The bug only shows with cancelled or refunded orders, which a real history always has.

Why a reproducible generator matters when a test fails: I need to rerun exactly the failing data to debug it and to confirm my fix. With Math.random, the next run had different orders and the failure could disappear without anything being fixed.

## Step 4 — Masking

The three problems the PII scan found in the original masking, and how I fixed each: (1) names and phone numbers leaked through delivery notes and order emails: I scrub free text for emails, phone numbers and every known customer name, and pseudonymise order emails too; (2) the email hash was plain SHA-256, reversible by hashing a customer list: I use HMAC-SHA256 with a secret `MASK_KEY`; (3) orders and customers were masked differently so they no longer joined: one pseudonym function for both.

One way my masked data could still identify a person: in a small town, a postcode plus a few order dates and amounts might match only one person, especially combined with outside knowledge ("my neighbour orders a lot of AI books").
