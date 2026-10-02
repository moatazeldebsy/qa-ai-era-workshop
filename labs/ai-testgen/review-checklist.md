# Reviewing AI-generated tests

AI writes plausible tests fast. Plausible is not the same as correct. Review every generated test against this list before it is merged. Treat it like code from a new teammate who has never used the product.

## Does it test the right thing?

- [ ] **Oracle check:** for every `expect`, can you point to the requirement or spec line that says the value is right? A test that encodes current behaviour, bugs included, is a snapshot, not a test.
- [ ] **No invented facts:** prices, messages and IDs that are not in the spec are guesses. Look for the model's `// VERIFY:` markers, and also for unmarked ones.
- [ ] **Would it fail?** Break the code on purpose (or run the app with `BUG_MODE=cart`) and confirm the test goes red. A test that cannot fail is worse than none, because it gives false confidence.
- [ ] **Business rules covered:** thresholds, limits and permissions from the description, not just status codes.

## Is it a good test?

- [ ] Independent: no shared state, no ordering assumptions.
- [ ] Deterministic: no sleeps, no time or randomness without control.
- [ ] Readable: the test name states the rule; the data table explains the cases.
- [ ] At the right layer: a rule check that drives a browser belongs in an API or unit test.
- [ ] Not redundant with existing tests: AI happily generates near-duplicates.

## Is it safe?

- [ ] No real secrets, tokens or personal data in fixtures.
- [ ] No calls to production endpoints.
- [ ] Generated dependencies (new packages) were reviewed like any other dependency.

## Record what you changed

Keep a short note in the PR: how many generated tests you kept, fixed or deleted, and why. That ratio is the honest measure of how much the AI helped. Track it over time.
