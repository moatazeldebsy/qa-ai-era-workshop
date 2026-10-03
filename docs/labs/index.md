# Labs

Eight hands-on labs on the [demo app](../reference/demo-app.md). Each lab has a **core** part (do this) and **stretch goals** (if you finish early), and ends with **debrief questions** for the group.

Finish the [Quickstart](../getting-started.md) first.

| # | Lab | Time | Tracks | Module |
|---|---|---|---|---|
| 1 | [E2E with Playwright](lab-01-playwright-e2e.md) | 40 min | QA · Dev | 3 |
| 2 | [API testing](lab-02-api-testing.md) | 30 min | QA · Dev | 3 |
| 3 | [AI-assisted test generation](lab-03-ai-test-generation.md) | 45 min | QA · Dev · (Mgr observe) | 2 |
| 4 | [Flaky tests](lab-04-flaky-tests.md) | 25 min | QA · Dev | 2 |
| 5 | [Performance with k6](lab-05-performance-k6.md) | 30 min | QA · Dev | 3 |
| 6 | [Evaluating an LLM feature](lab-06-llm-evaluation.md) | 45 min | All | 5 |
| 7 | [Quality gates in CI](lab-07-quality-gate.md) | 35 min | All | 4 |
| 8 | [Measuring what matters](lab-08-metrics.md) | 30 min | All | 7 |

## Conventions

- Commands run from the repo root.
- `npm start` runs the app on <http://localhost:3210>. The Playwright labs start it for you.
- Results land in `test-results/`, which the quality gate in Lab 7 reads.
- Every lab works **without an API key**. Where a real model adds something, it is marked *optional*.
