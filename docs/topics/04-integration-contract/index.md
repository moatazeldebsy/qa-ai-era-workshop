# Topic 4 — Integration, API, and Contract Testing

*How to check that pieces still fit together when different teams change them independently.*

In Topic 3 the checkout talked to a fake inventory that always did what the test wanted. This topic replaces the fake with the real thing. **Quality Books now runs as two services**: the shop, and a separate **inventory service** owned by another team, which holds stock while a customer pays. The shop also gains an orders API: place, fetch and cancel.

You'll test the shop's HTTP API against its published OpenAPI contract, wire the two services together in integration tests, and use **Pact** consumer-driven contract tests to catch a mismatch between them without running them together. Both bugs you'll find are real, and every unit test in Topic 3 missed them.

<div class="topic-progress" data-topic="04"></div>

## What you'll be able to do

- Choose between narrow integration, component, broad integration and end-to-end tests.
- Write in-process API tests that check status codes, bodies, headers and side effects.
- Validate API responses against an OpenAPI contract, and find spec drift.
- Explain consumer-driven contract testing: consumer tests, contract files, provider states, verification, `can-i-deploy`.
- Tell breaking from non-breaking API changes, and prove which is which with a contract.
- Map client mistakes to 4xx and server failures to 5xx, and say why it matters.

## Before you start

Finish [Topic 3](../03-unit-component/index.md) first; this topic tests the same checkout through the real network. Run `npm install` again if you set up before Topic 4: it adds Pact, Ajv and a YAML parser.

## How to work through this topic

| Page | What you do | Time |
|---|---|---|
| [Concepts](concepts.md) | Read sections 1–13: levels of integration, API testing, OpenAPI, Pact, breaking changes | ~2.5 h |
| [Lab](lab.md) | Fix a 500-for-client-errors bug, find an integration bug, catch it with a contract, run a breaking-change drill | ~2.5 h |
| [Quiz & wrap-up](quiz.md) | Check your understanding, then take on the challenge | ~45 min |

```bash
npm run learn:start 4     # your own branch for this topic
npm run learn:check 4     # after each lab step: ✔ or what's missing
```

## What you'll come away with

- An API that answers client mistakes with the right 4xx, checked against its contract.
- A consumer–provider contract between two services that fails the build when either side drifts.
- A breaking-change drill showing which provider changes are safe, and which aren't.

!!! question "Stuck, or want to compare notes?"
    Ask in the [course discussions](https://github.com/moatazeldebsy/qa-ai-era-workshop/discussions) under **Topic 04**. When you've finished, post your notebook or your challenge solution there too.
