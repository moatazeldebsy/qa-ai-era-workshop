# Cheat sheet

## Commands

| Task | Command |
|---|---|
| Start the app | `npm start` (→ <http://localhost:3210>) |
| … with the buggy assistant | `npm run start:buggy` |
| … with the cart regression | `npm run start:bug-cart` |
| Unit tests | `npm run test:unit` |
| E2E + API tests | `npm test` |
| E2E only / API only | `npm run test:e2e` / `npm run test:api` |
| Flaky-test lab | `npm run test:flaky` |
| Open the last report | `npx playwright show-report` |
| Open a trace | `npx playwright show-trace test-results/playwright/<test>/trace.zip` |
| Record a test | `npx playwright codegen http://localhost:3210` |
| AI test generation | `npm run testgen` (or `-- --print`) |
| Performance smoke | `npm run perf:smoke` |
| LLM eval / viewer | `npm run eval:llm` / `npm run eval:llm:view` |
| Quality gate | `npm run gate` |
| Metrics | `npm run metrics` |
| Docs site | `mkdocs serve` |

## Playwright: locators, best first

```js
page.getByRole('button', { name: 'Add to cart' })   // what users and screen readers see
page.getByLabel('Search books')                      // form fields
page.getByText('Out of stock')                       // non-interactive text
page.getByTestId('total')                            // no accessible name? use a test id
page.locator('#book-list li')                        // last resort: structure
```

Assert with web-first assertions, which wait automatically. Never use `waitForTimeout`:

```js
await expect(locator).toHaveText('34.89');
await expect(locator).toHaveCount(2);
await expect(locator).toBeDisabled();
```

## k6 thresholds

```js
thresholds: {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<200', 'p(99)<500'],
  'http_req_duration{endpoint:cart}': ['p(95)<300'],
}
```

## promptfoo assertions

| Type | Use for |
|---|---|
| `contains` / `icontains` / `not-contains` | Must or must not mention something |
| `icontains-any` | One of several acceptable phrasings |
| `regex` | Formats (prices, IDs) |
| `javascript` | Programmatic rules ("every price exists in the catalogue") |
| `llm-rubric` | Tone, helpfulness, anything hard to express in code (needs a grader model) |
| `latency` / `cost` | Budgets for real-model calls |

## Reviewing AI-generated tests: the five questions

1. Can each assertion be traced to a requirement?
2. Are there invented values?
3. Does it fail when the code is broken?
4. Is it at the cheapest layer that can catch the bug?
5. Is it a duplicate?

## LLM feature checklist

- [ ] Eval suite in CI with grounding, injection and scope cases
- [ ] Prompt and model versioned and logged with each answer
- [ ] Output rendered as text, never HTML
- [ ] No sensitive data in prompts or logs
- [ ] Production canary prompts and quality signals monitored
- [ ] A named owner for the eval dataset
