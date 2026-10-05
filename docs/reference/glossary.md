# Glossary

**Agent (AI)** — A model that plans and calls tools (browser, shell, APIs) in a loop to reach a goal, rather than answering once.

**Boundary value analysis (BVA)** — Testing the values on and next to the edges of each partition, where off-by-one and `<` vs `<=` bugs live.

**Browser context** — An isolated browser session with its own cookies, storage and cache, like a fresh incognito window. Playwright gives each test its own.

**Canary (prompt / release)** — A small, constant probe: a release served to a fraction of traffic, or a fixed set of prompts sent to production on a schedule to detect drift.

**Change failure rate** — Share of deployments that cause a failure in production. One of the four DORA metrics.

**Consumer / provider** — In an API relationship, the consumer is the client that calls the API and the provider is the service that offers it. One provider usually has many consumers.

**Continuous delivery / deployment** — Delivery: every change that passes the pipeline is releasable, and people decide when. Deployment: every passing change goes to production automatically.

**Continuous integration (CI)** — Merging every change into a shared main branch frequently, with an automated build and tests on every merge.

**Contract test** — A test that checks a consumer and a provider agree on an API without running them together. Each side is tested against a shared contract.

**Critical path** — The longest chain of stages in a pipeline that depend on each other. It sets the minimum possible pipeline time.

**Decision table** — A table with one column per combination of conditions and the expected outcome for each. Exposes missing and contradictory rules.

**Defect escape rate** — Share of defects first found in production rather than before release.

**DORA metrics** — Deployment frequency, lead time for changes, change failure rate and time to restore. From the DevOps Research and Assessment programme.

**Drift** — Change over time in a model's behaviour or in its input data that degrades quality without any code change.

**End-to-end (E2E) test** — A test of a complete user journey through the whole system, usually driven through the UI in a real browser.

**Equivalence partitioning** — Splitting an input's values into groups the system should treat the same way, and testing one value from each group.

**Error → fault → failure** — A person's mistake (error) leaves a defect in the code (fault), which shows up as wrong behaviour (failure) only when that code runs with a triggering input.

**Eval** — A regression suite for an LLM feature: inputs plus assertions on outputs, graded deterministically, programmatically, by a model or by humans.

**Fake** — A working, simplified implementation of a collaborator used in tests, such as an in-memory inventory.

**Flaky test** — A test that passes and fails on the same code. Usually timing, shared state or an uncontrolled dependency.

**Grounding** — Constraining a model's answers to provided data (catalogue, documents) instead of its general training.

**Guardrail** — A control that keeps an AI feature within bounds: input filtering, output checks, scope limits, refusal handling.

**Hallucination** — A fluent, confident output that isn't supported by the provided data or by reality.

**Hyrum's Law** — With enough users of an API, every observable behaviour will be depended on by somebody, whether or not it was promised.

**Integration test** — A test that checks two or more real components working together, such as a service and the real service it calls.

**Invariant (property)** — A rule that must hold for every valid input, such as *total = subtotal + shipping*. It lets one test check thousands of inputs without knowing each expected value.

**Lead time for changes** — Time from commit to running in production.

**LLM-as-judge / model-graded assertion** — Using a model to grade another model's output against a rubric. Needs its own validation.

**Locator** — A description of how to find an element on a page, such as "the button named Ask". Good locators describe what a user sees.

**Metamorphic testing** — Checking how the outputs of related inputs must relate (reordering a cart doesn't change its total) when the exact right output is unknown.

**Mock** — A test double pre-programmed with expectations about how it will be called; the test fails if it's called differently.

**MTTD / MTTR** — Mean time to detect / to resolve (or restore) an incident.

**Mutation testing** — Deliberately introducing small bugs to check that the tests detect them. Measures test strength, not coverage.

**OpenAPI** — A standard, machine-readable format for describing HTTP APIs: paths, parameters, request and response schemas.

**Oracle** — The source of truth that tells a test what the right answer is (a spec, a rule, a reference implementation).

**Page object** — A class that wraps a page's locators and actions behind intention-revealing methods, so tests read like journeys.

**Pairwise testing** — Choosing configurations so that every pair of factor values appears together at least once; far fewer than all combinations.

**Prompt injection** — Input crafted to make a model ignore its instructions, e.g. to leak its system prompt or take unintended actions.

**Property-based testing** — Generating many inputs from a description of their shape and checking a property holds for all of them; failing inputs are shrunk to a minimal case.

**Provider state** — A named precondition ("book 1 has 12 copies in stock") that a provider sets up before replaying a contract interaction.

**Quality gate** — Automated, pre-agreed release criteria evaluated on test evidence; blocks the release when not met.

**Risk-based testing** — Prioritising tests by likelihood × impact of failure.

**Seam** — A place where you can change a program's behaviour without editing it there, such as an injected clock or service.

**Self-healing test** — A test that re-locates elements automatically when selectors break. Convenient, but may mask real changes.

**Shift left / shift right** — Moving quality activities earlier (requirements, design, commit) or later (production monitoring, canaries, experiments).

**Sociable / solitary test** — A sociable unit test uses real collaborators where they're fast and deterministic; a solitary test replaces every collaborator with a double.

**Spy** — A test double that records how it was called, so the test can check afterwards.

**Stub** — A test double that returns canned answers, such as a payment gateway that always declines.

**Synthetic monitoring** — Scripted user journeys run against production on a schedule.

**Test double** — Any object that stands in for a real collaborator in a test: dummy, stub, spy, mock or fake.

**Test impact analysis (TIA)** — Selecting only the tests a change could affect, using dependency graphs, coverage or history.

**Test pyramid** — Many fast unit tests, fewer API/contract tests, few E2E tests; LLM evals form a layer of their own.

**Test-driven development (TDD)** — Writing a failing test before the code that makes it pass, in small red–green–refactor cycles.

**Testability** — How easy it is to find out whether something works: controllability (can you set up the state?), observability (can you see the result?) and isolation (can you test it alone?).

**Verification / validation** — Building the product right (does it match the spec?) versus building the right product (does it meet the real need?).

**Web-first assertion** — A Playwright assertion that retries until the condition holds or times out, instead of checking once.
