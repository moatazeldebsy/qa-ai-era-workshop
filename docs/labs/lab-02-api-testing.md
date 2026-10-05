# Lab 2 — API testing

Cover the shop's business rules below the UI: faster than the browser, many more cases, and written as data tables that read like the rules themselves.

By the end you'll have:

- run **24 API tests in about a second**
- added a **pricing row** and a **validation row** to data-driven tests
- found a **coverage gap** against the OpenAPI spec
- traced a request with an **`x-request-id`** from the client to the server log

**Time:** 30 min · **Tracks:** QA, Dev · **Module:** [3. Tools & Technologies](../modules/03-tools-and-technologies.md)

## Prerequisites

- The [Quickstart](../start/setup.md) is done.

| File | What's in it |
|---|---|
| `labs/04-integration-contract/api/tests/books.api.spec.js` | Response shape, search, 404, request IDs |
| `labs/04-integration-contract/api/tests/cart.api.spec.js` | Pricing rules and validation as data tables |
| `labs/04-integration-contract/api/tests/assistant.api.spec.js` | The assistant endpoint's contract |
| `app/openapi.yaml` | The API spec |

## 1. Run the API tests

```bash
npm run test:api
```

```text title="Expected output"
  24 passed (1.2s)
```

Compare that with Lab 1's nine browser tests, which take several seconds. Same runner, same report, same CI wiring: Playwright's `request` fixture just skips the browser.

## 2. Read the data tables

```js title="labs/04-integration-contract/api/tests/cart.api.spec.js"
const pricing = [
  { name: 'single cheap book pays shipping', items: [{ bookId: 1, quantity: 1 }], subtotal: 29.99, shipping: 4.9, total: 34.89 },
  { name: 'exactly over the threshold ships free', items: [{ bookId: 1, quantity: 2 }], subtotal: 59.98, shipping: 0, total: 59.98 },
  // ...
];
```

Every row is a business rule, and the test name documents it. Adding a case means adding a row.

## 3. Add two rows

Using `app/openapi.yaml` and the catalogue in [Demo App](../reference/demo-app.md#catalogue), add:

- a **pricing** row: three copies of *Contract Testing in Practice* (`bookId: 4`)
- a **validation** row: `quantity` sent as the string `"2"`

??? success "Expected values"
    - 3 × 31.25 = **93.75**, shipping **0**, total **93.75**
    - `"2"` isn't an integer → **400** `{"error":"quantity must be an integer from 1 to 10"}`

```text title="Expected output"
  26 passed
```

## 4. Find a gap

The spec says `q` matches *title, author or tag*. Check `books.api.spec.js`: is each of the three tested? Add the missing case.

!!! tip "Spec-driven review"
    Reading the spec next to the tests is the fastest way to find gaps. In [Lab 3](lab-03-ai-test-generation.md) an AI model does the first pass, and you review it.

## 5. Trace a request

Start the app (`npm start`), then send a request with your own ID:

```bash
curl -i -H 'x-request-id: my-trace-123' localhost:3210/api/books/3
```

```text title="Expected response (headers)"
HTTP/1.1 200 OK
x-request-id: my-trace-123
content-type: application/json; charset=utf-8
```

```json title="Expected server log line"
{"level":"info","id":"my-trace-123","method":"GET","path":"/api/books/3","status":200,"ms":1}
```

The same ID appears in the response and in the server's log. With OpenTelemetry, it links a failing test straight to the server-side trace.

## The whole lab, end to end

```bash
npm run test:api                                   # 1. run
# 3. add the two rows to cart.api.spec.js
# 4. add the missing search case to books.api.spec.js
npm run test:api                                   #    re-run
npm start                                          # 5. in another terminal:
curl -i -H 'x-request-id: my-trace-123' localhost:3210/api/books/3
```

## Stretch goals

- **Schema check:** validate every book from `/api/books` against the `Book` schema in `openapi.yaml` (try the `ajv` package).
- Send `POST /api/cart/price` a 20 KB body. What status does Express return, and is that what you'd want?
- Run against a separately started app: `BASE_URL=http://localhost:3210 npm run test:api`.

## Debrief

1. Which E2E test from Lab 1 is now redundant?
2. The tests encode exact prices. When is that right, and when is it brittle?
3. Who should own these tests: QA, or the developers of the API?

## Next steps

<div class="grid cards" markdown>

-   **Lab 3 — AI-assisted test generation**

    ---

    Have a model draft these tests from the spec, then review them like a senior engineer.

    [→ Lab 3](lab-03-ai-test-generation.md)

-   **Lab 7 — Quality gates**

    ---

    Watch these tests block a release when a pricing bug is planted.

    [→ Lab 7](lab-07-quality-gate.md)

</div>
