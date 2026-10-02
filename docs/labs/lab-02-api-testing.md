# Lab 2 — API testing

**Time:** 30 min · **Tracks:** QA, Dev · **Module:** [3. Tools & Technologies](../modules/03-tools-and-technologies.md)

## Goal

Cover business rules **below the UI**: faster, more cases, and with clear, data-driven tests.

## Files

- `labs/api/tests/books.api.spec.js`: response shape, search, 404, request IDs
- `labs/api/tests/cart.api.spec.js`: pricing rules and validation as data tables
- `labs/api/tests/assistant.api.spec.js`: the assistant endpoint's contract
- `app/openapi.yaml`: the spec

## Steps

**1. Run them.**

```bash
npm run test:api
```

24 tests in about a second. Compare with Lab 1's nine browser tests taking several seconds.

**2. Read the data tables** in `cart.api.spec.js`. Every row is a business rule: *"two different books over threshold ship free"*. Adding a case is adding a row, and the test name documents the rule.

**3. Add rows.** Using `app/openapi.yaml` and `app/src/catalog.js`, add:

- a pricing row: three copies of *Contract Testing in Practice* (`bookId: 4`);
- a validation row: `quantity` sent as the string `"2"`.

??? success "Expected values"
    - 3 × 31.25 = **93.75**, shipping **0**, total **93.75**.
    - `"2"` is not an integer → **400** `quantity must be an integer from 1 to 10`.

**4. Find a gap.** The spec says `q` matches *title, author or tag*. Is every one of those tested? Add what's missing.

**5. Trace a request.** Run the app (`npm start`), then:

```bash
curl -i -H 'x-request-id: my-trace-123' localhost:3210/api/books/3
```

The same ID appears in the response header **and** in the server log line. Correlating a failing test with server-side logs is what this enables (Module 3, observability).

## Stretch goals

- Add a **schema check**: validate every book in `/api/books` against the `Book` schema in `openapi.yaml` (try the `ajv` package).
- Write a test showing that `POST /api/cart/price` with a 20 KB body is rejected. What status does Express return?
- Run the same tests against another environment: `BASE_URL=http://localhost:3210 npm run test:api` (with the app started separately).

## Debrief

1. Which E2E test from Lab 1 is now redundant?
2. The tests encode exact prices. When is that right, and when is it brittle?
3. Who should own these tests: QA or the developers of the API?
