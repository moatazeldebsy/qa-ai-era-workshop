# Topic 4 · Quiz & wrap-up

## Quiz

Ten questions about understanding, not recall. Pick an answer to see whether it's right and why. Your best score is saved on this device.

<div class="quiz" data-quiz="04" markdown>

<div class="quiz-q" markdown>

**1. The shop's Pact consumer test passed while the shop was reading the wrong field. Why?**

- [ ] Pact doesn't check response bodies
- [x] The consumer test encodes the consumer's own expectations; only provider verification compares them with the real provider
- [ ] The mock server was misconfigured
- [ ] Consumer tests only check status codes

<div class="quiz-why" markdown>
The consumer half proves the client works against *its idea* of the provider. The provider half replays that idea against the real service. Running only one half is like checking one side of a handshake.
</div>

</div>

<div class="quiz-q" markdown>

**2. Why did Topic 3's checkout unit tests never catch the `id` versus `reservationId` mismatch?**

- [ ] They didn't test cancellation
- [x] The fake inventory replaced the client and the service entirely, so the real client's assumption was never exercised
- [ ] Unit tests can't find bugs in HTTP code
- [ ] The mismatch only happens in production

<div class="quiz-why" markdown>
A double stands in for a collaborator, and its accuracy is an assumption. Contract and narrow integration tests are how you check that assumption.
</div>

</div>

<div class="quiz-q" markdown>

**3. The inventory team removes `expiresAt` from the reservation response. The shop never reads it. What does Pact verification report?**

- [x] Pass: no consumer declared that field, so removing it breaks nobody
- [ ] Fail: the response no longer matches the OpenAPI spec
- [ ] Fail: every field in a response is part of the contract
- [ ] Pact can't tell

<div class="quiz-why" markdown>
Consumer-driven contracts only contain what consumers use. That's their superpower: they can prove a change is safe, which a provider-only spec can't.
</div>

</div>

<div class="quiz-q" markdown>

**4. A client sends broken JSON and gets `500 internal error`. What's the main problem?**

- [ ] 500 is slower than 400
- [x] 5xx says "our fault, maybe retry": it triggers retries and pages the provider's on-call engineer for a client's mistake
- [ ] Nothing: any error code is fine
- [ ] Browsers can't display 500 responses

<div class="quiz-why" markdown>
Status classes are part of the API's contract. 4xx tells the client to fix its request; 5xx tells everyone the server failed.
</div>

</div>

<div class="quiz-q" markdown>

**5. What does a provider state such as "book 1 has 12 copies in stock" do?**

- [ ] It documents the consumer's database
- [x] It tells the provider's verification which precondition to set up before replaying that interaction
- [ ] It mocks the consumer
- [ ] It's a comment with no effect

<div class="quiz-why" markdown>
State handlers on the provider side put the real service into the expected state, so verification doesn't depend on whatever data happens to be there.
</div>

</div>

<div class="quiz-q" markdown>

**6. Why do the integration tests start each server on port 0?**

- [ ] Port 0 is faster
- [x] The OS picks any free port, so tests never collide with each other or a running app
- [ ] Port 0 disables networking
- [ ] Express requires it in tests

<div class="quiz-why" markdown>
Fixed ports cause flaky "address in use" failures in parallel runs and on developer machines. Ask for port 0 and read the real port back.
</div>

</div>

<div class="quiz-q" markdown>

**7. Which change to a provider's API is breaking for its existing consumers?**

- [ ] Adding an optional field to a response
- [ ] Adding a new endpoint
- [x] Making an optional request field required
- [ ] Adding an optional query parameter

<div class="quiz-why" markdown>
Existing consumers don't send the field, so their requests start failing. Additive, optional changes are safe for tolerant readers.
</div>

</div>

<div class="quiz-q" markdown>

**8. The shop accepts `bookId: "3"` although its contract says integer. What's the long-term risk?**

- [ ] None: being lenient is always good
- [x] Clients start depending on the leniency, so tightening validation later breaks them
- [ ] Strings are slower to parse
- [ ] The database will reject it

<div class="quiz-why" markdown>
Hyrum's Law: with enough users, every observable behaviour gets depended on. Validate strictly at the edge, and read tolerantly.
</div>

</div>

<div class="quiz-q" markdown>

**9. When is a narrow integration test the better choice than a broad one?**

- [x] When you want to check one interface against a real dependency, with little setup and fast feedback
- [ ] Never: broad tests find more bugs
- [ ] Only for databases
- [ ] When you have no contract

<div class="quiz-why" markdown>
Narrow tests (your code plus one real dependency) find the same interface bugs as broad ones, with a fraction of the setup and flakiness.
</div>

</div>

<div class="quiz-q" markdown>

**10. What question does a Pact Broker's `can-i-deploy` answer?**

- [ ] Is the build green?
- [x] Is this version compatible with the versions of its consumers and providers in the target environment?
- [ ] Did the unit tests pass?
- [ ] Is the server up?

<div class="quiz-why" markdown>
The broker records which versions verified which contracts, and which versions are deployed where. `can-i-deploy` combines the two into a deployment gate.
</div>

</div>

</div>

## Wrap-up

### Mental model

> **Every boundary between components is an assumption. Integration and contract tests turn assumptions into checks.**
>
> A double assumes how a collaborator behaves. A client assumes the shape of a response. A provider assumes nobody uses that field. Contract tests write those assumptions down and check them *from both sides*, in each team's own pipeline. Integration tests check the riskiest ones for real. Neither replaces the other.

### 10 key things to remember

1. **Doubles are assumptions.** Check them against the real provider, or they drift.
2. **A contract has two halves.** Consumer tests alone can encode the bug; provider verification is what catches it.
3. **Contract only what you use**, with matchers instead of exact values.
4. **Consumer-driven contracts can prove a change is safe**; a provider-only spec can't know who uses what.
5. **Status classes are part of the API.** Client mistakes are 4xx, server failures 5xx, dependency outages 503.
6. **Check side effects in other systems**, not just the response you got.
7. **Validate strictly, read tolerantly.** Leniency becomes an accidental contract (Hyrum's Law).
8. **Prefer narrow integration tests** (your code + one real dependency) to broad environments.
9. **Port 0 and a known state per test** remove most integration flakiness.
10. **Validate responses against your OpenAPI spec**, or the spec quietly stops describing the API.

### Common mistakes

- Running only the consumer half of a contract test.
- Contracts full of exact values, so every data change breaks verification.
- Using contract tests to test the provider's business logic.
- Relying on a shared staging environment as the only integration check.
- Answering 500 to invalid input, or leaking stack traces in errors.
- Checking only the API's response, not the state it changed elsewhere.
- Undocumented endpoints that clients use anyway.
- Hard-coded ports and shared test data.

### Hands-on challenge

**Make the orders API a first-class contract.**

1. `POST /api/orders`, `GET /api/orders/{id}` and `POST /api/orders/{id}/cancel` aren't in `app/openapi.yaml`. Document them, including every status code the code can return (201, 400, 402, 404, 409, 413, 503).
2. Add cases to `api.test.js` that drive each documented status and validate each response against the spec. Did writing the spec make you find any behaviour you'd call a bug?
3. Add a fourth consumer interaction: the inventory service is asked to release a reservation that doesn't exist (`404`). What should the client do, and is that in the contract now?
4. **Stretch:** run a Pact Broker locally with Docker (`pactfoundation/pact-broker`), publish the shop's contract to it, verify from the broker, and run `can-i-deploy` for the inventory service before and after the rename from step 4.

Share your OpenAPI additions in the discussions: other learners will have made different choices about 402 versus 409.

### What to learn next

**Topic 5 — UI, Web, and End-to-End Testing.** You've tested the shop from the inside (units), through its API, and between services. Topic 5 tests it the way customers use it: in a real browser. You'll write Playwright tests with resilient locators and page objects, find out why E2E tests go flaky and how to fix them properly, and run the Topic 2 pairwise matrix across browsers and screen sizes.

Read before Topic 5 (optional):

- Martin Fowler, [*Contract Test*](https://martinfowler.com/bliki/ContractTest.html) and [*Integration Test*](https://martinfowler.com/bliki/IntegrationTest.html)
- Pact documentation, [*How Pact works*](https://docs.pact.io/getting_started/how_pact_works)
- Hyrum Wright, [*Hyrum's Law*](https://www.hyrumslaw.com/)

When you've finished the lab and the challenge, move on to [Topic 5](../05-ui-e2e/index.md).
