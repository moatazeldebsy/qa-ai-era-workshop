# Quality strategy — Quality Books

Topic 14. Reference answer: one reasonable strategy, built on the scorecard and the course's notebooks.

## 1. Context

What the product is, who uses it, and what "quality" means for them (look back at your Topic 1 quality attributes): a small online bookshop with a cart, orders, an inventory service and an AI support assistant. Customers need correct prices and stock, a checkout that works on their device, and honest answers from the assistant. The business needs trust (money and AI answers are public), low support load, and compliance with privacy and accessibility law. Two small teams; releases several times a week.

## 2. Quality goals

The three quality attributes that matter most, each with a measurable goal:

| Attribute | Goal | How we'll know (metric or evidence) |
|---|---|---|
| Functional correctness (incl. AI) | No customer-facing pricing or stock defect escapes in the quarter; the assistant never states a price that isn't in the catalogue | Defect escape rate (Topic 11); 100% pass on the grounding evals, required by the gate |
| Reliability and performance | 99.5% of API requests without a 5xx and 99% under 250 ms over 30 days | SLO report from production histograms (Topic 10); k6 thresholds per release (Topic 8) |
| Security and accessibility | No known high-severity vulnerability in production dependencies; no critical barrier in the purchase journey | `sec:audit` in CI; red team required by the gate; axe plus a manual screen-reader check of checkout each release |

## 3. Top risks

The five risks that drive the strategy, with their evidence today:

| Risk | Score | Evidence today | Good enough? |
|---|---|---|---|
| R2 The assistant invents a price or book | 16 | Grounding evals (9 cases) | No: the evals are optional in the gate; make them required |
| R1 Shipping charged on a free order | 12 | Invariant sweep, API and E2E tests | Yes: three levels, one of them exhaustive |
| R3 The assistant leaks its instructions or acts out of role | 12 | Red team (13 attacks), now with a global leak check | Almost: make it required in the gate |
| R4 Ordering more than is in stock | 8, should be 12 | One UI error-message test | No: Topic 2 found it happening; add the duplicate-line API test and the stock property, and rescore |
| R6 Pricing slows down under load | 6, should be 9 | k6 cart p95 threshold (now linked correctly) | Yes for the smoke level; add an order-path load test before peak season |

## 4. Approach by level

What we test where, and what we deliberately don't: pricing, orders and refunds rules at unit level with boundaries, decision tables and properties (Topics 2–3); every service contract with Pact plus OpenAPI validation (Topic 4); a dozen browser journeys only, including keyboard use, across a pairwise browser matrix nightly (Topic 5); k6 smoke per merge and order-path load before releases (Topic 8); the assistant through evals and red team on every change to prompt, model or data (Topic 12); production through SLOs, readiness and a synthetic journey every minute (Topic 10). We deliberately don't test rules through the browser, don't keep a manual regression suite, and don't chase 100% coverage or mutation scores.

## 5. Release decision

What the quality gate requires, and what you'd change after reading the scorecard: today it requires only the functional tests. I'd require the grounding evals and the red team (R2 and R3 are two of the top three risks), keep performance advisory per merge but required for releases, cap skipped tests at zero and reject stale evidence (Topic 6), and read flakiness from Playwright's JSON, not JUnit (Topic 11).

## 6. Investments

The three improvements you'd fund first, each with the evidence that justifies it and how you'd measure success:

1. **Put both services on the platform baseline** (Topic 13): the fleet report shows 3 and 4 standards failing on main, and each failure was found separately in Topics 4, 9 and 10. Success: 5/5 standards on every service, and every new service scaffolded on the paved road.
2. **Make the gate follow the risk ranking:** required AI evals and red team, skipped-test and freshness checks. Success: no release without evidence for the top three risks; zero "green with skipped tests" releases.
3. **Close the stock-integrity gap (R4)** across levels: API validation, a property test that allows duplicates, and a contract case for 409s. Success: the oversell scenario is caught at unit, API and contract level, and R4 is re-scored with real evidence.

## 7. Ownership and review

Who owns what (teams, platform, enabling roles), and when this strategy is reviewed: the shop team owns pricing, checkout and the assistant's evals; the inventory team owns its service and contract; a part-time platform role owns the baseline, conformance kit, reusable CI and the scorecard; a quality engineer coaches both teams and runs the monthly scorecard review. This strategy is reviewed quarterly, and after any sev1 or sev2 incident.
