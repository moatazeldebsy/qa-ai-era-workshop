# Glossary

**Agent (AI)** — A model that plans and calls tools (browser, shell, APIs) in a loop to reach a goal, rather than answering once.

**Canary (prompt / release)** — A small, constant probe: a release served to a fraction of traffic, or a fixed set of prompts sent to production on a schedule to detect drift.

**Change failure rate** — Share of deployments that cause a failure in production. One of the four DORA metrics.

**Defect escape rate** — Share of defects first found in production rather than before release.

**DORA metrics** — Deployment frequency, lead time for changes, change failure rate and time to restore. From the DevOps Research and Assessment programme.

**Drift** — Change over time in a model's behaviour or in its input data that degrades quality without any code change.

**Eval** — A regression suite for an LLM feature: inputs plus assertions on outputs, graded deterministically, programmatically, by a model or by humans.

**Flaky test** — A test that passes and fails on the same code. Usually timing, shared state or an uncontrolled dependency.

**Grounding** — Constraining a model's answers to provided data (catalogue, documents) instead of its general training.

**Guardrail** — A control that keeps an AI feature within bounds: input filtering, output checks, scope limits, refusal handling.

**Hallucination** — A fluent, confident output that isn't supported by the provided data or by reality.

**Lead time for changes** — Time from commit to running in production.

**LLM-as-judge / model-graded assertion** — Using a model to grade another model's output against a rubric. Needs its own validation.

**MTTD / MTTR** — Mean time to detect / to resolve (or restore) an incident.

**Mutation testing** — Deliberately introducing small bugs to check that the tests detect them. Measures test strength, not coverage.

**Oracle** — The source of truth that tells a test what the right answer is (a spec, a rule, a reference implementation).

**Error → fault → failure** — A person's mistake (error) leaves a defect in the code (fault), which shows up as wrong behaviour (failure) only when that code runs with a triggering input.

**Invariant (property)** — A rule that must hold for every valid input, such as *total = subtotal + shipping*. It lets one test check thousands of inputs without knowing each expected value.

**Testability** — How easy it is to find out whether something works: controllability (can you set up the state?), observability (can you see the result?) and isolation (can you test it alone?).

**Verification / validation** — Building the product right (does it match the spec?) versus building the right product (does it meet the real need?).

**Prompt injection** — Input crafted to make a model ignore its instructions, e.g. to leak its system prompt or take unintended actions.

**Quality gate** — Automated, pre-agreed release criteria evaluated on test evidence; blocks the release when not met.

**Risk-based testing** — Prioritising tests by likelihood × impact of failure.

**Self-healing test** — A test that re-locates elements automatically when selectors break. Convenient, but may mask real changes.

**Shift left / shift right** — Moving quality activities earlier (requirements, design, commit) or later (production monitoring, canaries, experiments).

**Synthetic monitoring** — Scripted user journeys run against production on a schedule.

**Test pyramid** — Many fast unit tests, fewer API/contract tests, few E2E tests; LLM evals form a layer of their own.

**Web-first assertion** — A Playwright assertion that retries until the condition holds or times out, instead of checking once.
