# Cheat sheet

## Course commands

| Task | Command |
|---|---|
| Check the machine | `npm run learn:doctor` |
| Start a topic on its own branch | `npm run learn:start NN` |
| Check a topic's lab | `npm run learn:check NN` |
| Progress across all topics | `npm run learn:status` |
| Compare with the reference solution | `git diff upstream/main upstream/solutions -- <path>` |

## The demo app

| Task | Command |
|---|---|
| Start the shop | `npm start` (→ <http://localhost:3210>) |
| Shop and inventory service together (needed for checkout and orders) | `npm run start:all` |
| Inventory service alone | `npm run start:inventory` (→ port 3220) |
| … with the buggy assistant | `npm run start:buggy` |
| … with the cart regression | `npm run start:bug-cart` |
| Unit tests | `npm run test:unit` |
| E2E + API tests | `npm test` (`test:e2e` / `test:api` for one) |

## Per topic

| Topic | Commands |
|---|---|
| 1 Foundations | `foundations:test` · `foundations:risks` · `foundations:bug-hunt` |
| 2 Test design | `design:test` · `design:pairwise` · `design:mutants` |
| 3 Unit & component | `unit:test` · `unit:coverage` · `unit:mutate` |
| 4 Integration & contract | `contract:test` · `contract:verify` |
| 5 UI & E2E | `test:e2e` · `test:flaky` · `ui:brittle` · `ui:matrix` |
| 6 CI/CD | `ci:test` · `ci:pipeline` · `ci:impact` · `gate` |
| 7 Environments & data | `data:test` · `data:shared` · `data:generate` · `data:mask` · `data:scan` |
| 8 Performance | `perf:test` · `perf:smoke` · `perf:orders` · `perf:stress` |
| 9 Security & accessibility | `sec:test` · `sec:audit` · `a11y:test` · `eval:redteam` |
| 10 Observability | `obs:test` · `obs:slo` · `obs:synthetic` |
| 11 Quality intelligence | `qi:test` · `qi:collect` · `qi:report` · `metrics` |
| 12 AI in QA | `testgen` · `ai:score` · `eval:llm` · `eval:llm:view` · `agent -- free-shipping` · `test:agent-tools` |
| 13 Platform | `platform:test` · `platform:fleet` · `platform:new -- <name>` |
| 14 Strategy | `strategy:test` · `strategy:scorecard` |

Prefix each with `npm run`. Arguments go after `--`.

## Playwright tools

| Task | Command |
|---|---|
| Open the last report | `npx playwright show-report` |
| Open a trace | `npx playwright show-trace test-results/playwright/<test>/trace.zip` |
| Record a test | `npx playwright codegen http://localhost:3210` |
| Docs site locally | `mkdocs serve` |

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
