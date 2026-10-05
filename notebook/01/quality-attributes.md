# Quality attributes of Quality Books

Topic 1, lab step 1. Reference answer: one reasonable set of answers, not the only one.

| Characteristic | What it means for Quality Books | Evidence I'd collect |
|---|---|---|
| Functional suitability | Prices, shipping, stock and refunds are calculated exactly as the policy says | Unit and API tests on pricing rules; the invariant sweep over every sellable cart |
| Performance efficiency | Search and pricing answer quickly at normal and peak traffic | k6 smoke and load tests with p95 thresholds |
| Compatibility | The web shop and any API client (a future mobile app) keep working as the API evolves | Contract tests against `openapi.yaml`; cross-browser runs |
| Interaction capability | Customers, including keyboard and screen-reader users, can find a book and buy it | axe accessibility scans; a keyboard-only E2E journey; usability sessions |
| Reliability | The shop keeps selling when the slow recommendations widget or the AI assistant fails | Fault-injection tests; error-rate monitoring on `/metrics` |
| Security | Nobody can make the assistant leak its instructions, or order stock that doesn't exist | LLM red-team suite; abuse-case API tests; dependency scanning |
| Maintainability | A developer can change a pricing rule and know within minutes if anything broke | Fast unit suite; mutation score; testable seams such as `shippingFor()` |
| Flexibility | The shop runs the same on a laptop, in Codespaces and in CI | One-command setup (`npm run learn:doctor`); CI on a clean runner |
| Safety | The assistant never gives medical, legal or financial advice that could hurt someone | Off-topic and red-team evals in CI; review of real transcripts |

## My top three, and why

1. **Functional suitability**: money is involved; a wrong price costs trust immediately and can be a legal problem.
2. **Security (of the AI assistant)**: it's the newest, least understood part, and a single leaked prompt or invented price is public and embarrassing.
3. **Interaction capability**: a small shop can't afford to lose customers who can't complete checkout, and accessibility is increasingly a legal requirement.
