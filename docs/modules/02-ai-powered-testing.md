# 2. AI-Powered Testing

*Smarter, faster and more scalable*

## Why it matters

Large language models can read a spec, a diff or a stack trace and produce something useful in seconds. Used well, that removes the most repetitive parts of testing. Used badly, it produces thousands of confident, plausible tests that check nothing. This module is about getting the first outcome and avoiding the second.

## Key ideas

### AI-assisted test generation (unit, API, E2E)

| Layer | Good input for the model | What it does well | What to watch |
|---|---|---|---|
| Unit | The function + its docstring/types | Edge cases, boundary values, table-driven tests | Asserting current behaviour, bugs included |
| API | OpenAPI spec, example requests | Status-code and schema coverage, validation cases | Invented values (prices, messages) |
| E2E | User story + the page's accessibility tree | Journey skeletons with role-based locators | Brittle selectors, missing waits |

The rule that makes it work: **the model proposes, a human disposes.** Lab 3 makes this concrete: generate from `app/openapi.yaml`, then review with a checklist.

### Intelligent test data and scenario creation

Models are good at producing *realistic* data: names in many scripts, addresses in many formats, and the awkward cases (`O'Brien`, `ß`, emoji, right-to-left text) that people forget. Two cautions:

- **Never** paste real customer data into a third-party model to "make it realistic".
- Generated data must still be **deterministic in CI**: generate once, review, commit the fixture.

### Self-healing tests and flakiness reduction

"Self-healing" tools re-locate an element when its selector breaks, for example by matching text or position. That helps with cosmetic UI changes, and it is dangerous for real ones: a "healed" locator can click the *wrong* button and pass. Prefer, in order:

1. **Resilient locators by design**: `getByRole`, `getByLabel`, and test IDs for things with no accessible name (see `labs/playwright/pages/ShopPage.js`).
2. **Web-first assertions** that wait for a condition instead of sleeping (Lab 4).
3. **AI-assisted triage**: let a model cluster failures and suggest the cause, and have a human approve the fix.
4. Self-healing, if at all, in **report-only mode**: it suggests the fix, CI still fails.

### AI-powered defect analysis and root cause

Given logs, a trace and the diff, a model can draft a root-cause hypothesis faster than a person can open the files. Useful prompts:

- "Here is the failing test, its trace, and the diff since the last green run. List the three most likely causes, most likely first, with the evidence for each."
- "Cluster these 200 failures by probable root cause."

Treat the output as a **hypothesis to verify**, never as the conclusion in the incident report.

### Predictive quality and risk detection

Signals that predict defects: churn (files changed often), complexity, ownership spread, past defect density, and how much of the change the tests cover. Models can combine them to rank pull requests by risk and route more review or testing to the riskiest. Start simple: a heuristic score is better than none, and it is explainable.

## Discuss

1. Where has AI already saved you time in testing? Where did it waste time?
2. Who reviews AI-generated tests in your team, and how?
3. Would you trust a self-healing test in your release pipeline? What would change your mind?

## Exercise (15 min): risk-based test ideas with AI

Use the prompt in `labs/ai-testgen/prompts/risk-based-test-ideas.md` with this feature:

> *"Add a discount-code field to the Quality Books cart. Codes give 10% or 20% off, cannot be combined, and expire."*

In pairs: compare the model's top 8 risks to your own list. Which did it miss? Which did *you* miss? Was anything it said wrong?

## Takeaways by role

=== "QA & SDET"
    Become an excellent **reviewer** of generated tests. Lab 3's checklist is a starting point; make it your team's.

=== "Developers"
    AI makes writing tests cheap. That makes deleting bad tests important: a generated test that can't fail is negative value.

=== "Managers & leads"
    Measure AI's impact by **kept vs discarded** generated tests and by escaped defects, not by "tests generated". Volume is the easy number and the wrong one.

## Next steps

<div class="grid cards" markdown>

-   **Lab 3 — AI-assisted test generation**

    ---

    Generate tests from the OpenAPI spec, then review them like a senior engineer.

    [→ Lab 3](../labs/lab-03-ai-test-generation.md)

-   **Lab 4 — Flaky tests**

    ---

    Prove a flaky test's cause and fix it properly, not with retries.

    [→ Lab 4](../labs/lab-04-flaky-tests.md)

</div>
