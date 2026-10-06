# Topic 4 · Concepts

## 1. What is it?

Unit tests check pieces in isolation. This topic checks that the pieces **fit together**:

- **Integration testing** checks that two or more real components work together: your code and a database, your service and another service, your client and a real HTTP server.
- **API testing** checks a service through its public interface (usually HTTP) as a client would see it: status codes, headers, bodies, errors.
- **Contract testing** checks that a **consumer** (a client of an API) and a **provider** (the service that offers it) agree on what the API looks like, **without running them together**. Each side tests against a shared, written-down contract.

Three more terms you'll need:

- **Consumer / provider.** In "the shop calls the inventory service", the shop is the consumer and the inventory service is the provider. One provider usually has many consumers.
- **Contract.** The agreement between them: requests the consumer sends, and responses it relies on. It can be written by the provider (an **OpenAPI** specification, "provider-driven") or derived from the consumers' tests (**Pact**, "consumer-driven").
- **Schema.** A machine-readable description of the shape of data (JSON Schema, which OpenAPI uses). Validating a response against its schema checks types and required fields, not the business meaning.

## 2. Why do we need it?

Because most production incidents in distributed systems happen **between** components, not inside them:

- **Doubles lie.** Topic 3's fake inventory returned whatever the test wanted. If the real inventory service answers differently, every unit test stays green while production breaks. This topic's lab shows exactly that.
- **Teams change things independently.** The inventory team renames a field, and the shop breaks on deploy. Without a contract check, the first person to find out is a customer.
- **End-to-end environments don't scale.** Testing every combination of service versions in a shared staging environment is slow, flaky and blocks teams on each other (Topic 7). Contract tests let each team verify compatibility in its own pipeline, in seconds.
- **APIs are products.** An API's error responses, status codes and edge cases are part of its behaviour. Clients depend on them, often in ways nobody wrote down.

## 3. How does it work internally?

### Integration and API tests

The test starts the real component(s), talks to them over the real protocol, and checks the response *and* the side effects:

![An integration test: the test starts the inventory service in a known state and the shop pointing at it, places an order for two copies of book 1, the shop reserves stock in the inventory service, the order comes back paid, and the test checks the side effect: 10 copies left.](../../assets/diagrams/04-integration-test.svg#only-light){ loading=lazy }
![An integration test: the test starts the inventory service in a known state and the shop pointing at it, places an order for two copies of book 1, the shop reserves stock in the inventory service, the order comes back paid, and the test checks the side effect: 10 copies left.](../../assets/diagrams/04-integration-test-dark.svg#only-dark){ loading=lazy }

Starting servers on **port 0** asks the operating system for any free port, so tests never collide with each other or with a running copy of the app.

### Consumer-driven contract testing (Pact)

Pact splits one integration test into two halves that run in **different pipelines**, connected by a contract file:

![Consumer-driven contract testing: in the shop's pipeline, a consumer test of the real client against a Pact mock provider produces a contract file, which is published to a Pact broker; in the inventory team's pipeline, provider verification replays each request against the real service in the provider state it asks for, results go back to the broker, and the broker answers can-i-deploy.](../../assets/diagrams/04-pact-flow.svg#only-light){ loading=lazy }
![Consumer-driven contract testing: in the shop's pipeline, a consumer test of the real client against a Pact mock provider produces a contract file, which is published to a Pact broker; in the inventory team's pipeline, provider verification replays each request against the real service in the provider state it asks for, results go back to the broker, and the broker answers can-i-deploy.](../../assets/diagrams/04-pact-flow-dark.svg#only-dark){ loading=lazy }

1. **Consumer side.** The shop's test describes each interaction: *given* a provider state, *upon receiving* this request, the provider *will respond with* at least this. Pact starts a **mock provider** that answers exactly that, and the test runs the shop's **real client** against it. If the client sends something else, or can't handle the response, the test fails. The output is a contract file (JSON).
2. **Provider side.** The inventory team's pipeline loads the contract, puts the **real** service into each **provider state** (*"book 1 has 12 copies in stock"*), replays each request, and compares the real response with the expected one.
3. **Matching rules.** Expectations can be exact values or **matchers**: `like('res-1')` means "any string", `regex(...)` and `eachLike(...)` describe shapes. Good contracts match on type and shape, not exact data, so the provider can return any real ID.
4. **Only what's used.** A response may contain more fields than the contract mentions. Pact only checks the fields the consumer declared. Unused fields can change freely; used ones can't.
5. **Deployment safety.** A **Pact Broker** (or PactFlow) stores contracts and verification results per version, and answers *"can I deploy version X of the shop to production?"*

### Provider-driven contracts (OpenAPI)

The provider publishes an OpenAPI document. Tests can validate real responses against it (as this lab's `openApiContract()` helper does with the Ajv JSON-schema validator), generate client code or mock servers from it, or fuzz the API with schema-based tools such as Schemathesis. The weakness: the document says what the provider *offers*, not what each consumer *uses*, so it can't tell which changes are safe.

## 4. Main components and concepts

### 4.1 Levels of integration

| Level | What's real | Example in this course | Speed |
|---|---|---|---|
| **Narrow integration** | Your code plus **one** real dependency | The shop's inventory client against the real inventory service | Tens of ms |
| **Component / service test** | One whole service through its API, other services faked | `api.test.js`: the real shop over HTTP, inventory pointing at a dead port | Tens of ms |
| **Broad integration** | Several real services together | `integration.test.js`: shop + inventory | 100 ms+ |
| **End-to-end** | Everything, through the UI | Topic 5 | Seconds |

Martin Fowler calls the first kind *narrow* integration tests, and recommends them over *broad* ones: they find the same interface bugs with a fraction of the setup.

### 4.2 In-process versus out-of-process API tests

| | In-process | Out-of-process |
|---|---|---|
| How | Start `createApp()` inside the test on port 0 | Start the server separately; tests call its URL |
| This repo | `labs/04-integration-contract/tests/api.test.js` | The Playwright `api` project, `labs/04-integration-contract/api/` |
| Pros | Fast, no setup, can inject config and dependencies | Tests the real deployable, can run against staging or production |
| Cons | Not exactly the deployed artefact | Slower; state is harder to control |

Both are worth having: in-process for every edge case, out-of-process for a smoke check of what's actually deployed.

### 4.3 What to check in an API test

- **Status code.** The right class (2xx, 4xx, 5xx) and the right code: 400 versus 404 versus 409 versus 422 all mean different things to a client.
- **Body.** Values that matter, plus the shape (schema validation).
- **Headers.** Content type, caching, correlation ids (`x-request-id`), security headers (Topic 9).
- **Side effects.** Did the stock actually change in the *other* service? The lab's integration bug is invisible in the shop's own responses.
- **Errors.** Malformed input, missing fields, wrong types, too-large bodies, unknown ids, and dependency failures (503). Clients depend on error behaviour too.

**4xx versus 5xx matters.** A 4xx means "your request was wrong, don't retry it as is". A 5xx means "we failed, maybe retry", and it usually pages someone at the provider. Answering 500 to a client's broken JSON creates false alarms and retry storms.

### 4.4 Contract styles compared

| | Consumer-driven (Pact) | Provider-driven (OpenAPI + validation) | Bi-directional (PactFlow) |
|---|---|---|---|
| Contract written by | Each consumer's tests | The provider | Both: consumer pact compared with provider's OpenAPI |
| Knows what each consumer uses | Yes | No | Yes |
| Provider needs to | Run verification with provider states | Keep the spec accurate | Prove its spec matches its implementation |
| Best for | Internal APIs with known consumers | Public APIs with unknown consumers | Teams that already maintain OpenAPI |

### 4.5 Provider states

A provider state is a named precondition (*"reservation res-1 exists"*). The provider team implements a **state handler** that sets it up before the interaction is replayed. States keep contract tests independent of whatever data happens to be in the provider. They're also where most contract-testing effort goes: keep them few and meaningful.

### 4.6 Postel's law and tolerant readers

*"Be conservative in what you send, liberal in what you accept"* (Jon Postel). Applied to APIs:

- **Tolerant reader:** a consumer should read only the fields it needs and ignore unknown ones, so providers can add fields safely.
- **Strict validation at the edge:** a provider that accepts invalid input (the shop accepts `bookId: "3"` although the contract says integer, from Topic 2) creates an *accidental contract*: someone will depend on that leniency, and tightening it later breaks them. This is sometimes called **Hyrum's Law**: *with enough users, every observable behaviour of your API will be depended on by somebody.*

### 4.7 Versioning and breaking changes

| Change | Breaking? |
|---|---|
| Add an optional response field | No, for tolerant readers |
| Add an optional request field | No |
| Remove or rename a response field a consumer uses | **Yes** |
| Make an optional request field required | **Yes** |
| Change a type (number → string) | **Yes** |
| Change an error status (409 → 400) | **Yes**, if a consumer handles it |
| Remove a response field no consumer uses | No, and only consumer-driven contracts can prove that |

Strategies: additive changes only; *expand and contract* (add the new field, migrate consumers, then remove the old one); and explicit versions (`/v2/...`) for unavoidable breaks.

### 4.8 Test doubles at the HTTP level

When the real dependency can't run in your test, stub it at the network level rather than in code: WireMock, MockServer, nock, MSW, or Pact's own mock server. **Service virtualisation** tools record real traffic and replay it. Every one of these is a double, so its accuracy must be checked against the real provider. That's exactly what contract verification does.

## 5. Architecture: the shop, the inventory service, and the tests around them

![The shop, the inventory service and the tests around them: the shop's routes call createCheckout(), which uses inventory-client.js to call the inventory service over HTTP. Topic 3 unit tests use a fake inventory; api.test.js tests the shop over HTTP against its OpenAPI schema; integration.test.js runs the shop with the real inventory; the consumer test checks the real client against a Pact mock and writes the pact files, which verify-provider.mjs replays against the real inventory service, described by its own OpenAPI file.](../../assets/diagrams/04-architecture.svg#only-light){ loading=lazy }
![The shop, the inventory service and the tests around them: the shop's routes call createCheckout(), which uses inventory-client.js to call the inventory service over HTTP. Topic 3 unit tests use a fake inventory; api.test.js tests the shop over HTTP against its OpenAPI schema; integration.test.js runs the shop with the real inventory; the consumer test checks the real client against a Pact mock and writes the pact files, which verify-provider.mjs replays against the real inventory service, described by its own OpenAPI file.](../../assets/diagrams/04-architecture-dark.svg#only-dark){ loading=lazy }

Each test covers a different seam. Only the integration test and the contract verification ever compare the client's assumptions with the real provider.

## 6. How it connects with other practices

| Practice | Connection |
|---|---|
| **Unit tests and doubles (Topic 3)** | Contract tests are how you keep doubles honest. A fake that passes the provider's contract verification is a fake you can trust. |
| **Test design (Topic 2)** | API inputs are partitions too: valid, invalid, wrong type, missing, too large, duplicates. |
| **E2E (Topic 5)** | Contracts remove most of the reasons to test service combinations end to end; keep E2E for user journeys. |
| **CI/CD (Topic 6)** | Consumer tests and provider verification run in each team's pipeline; `can-i-deploy` becomes a deployment gate. |
| **Environments (Topic 7)** | Contract tests reduce the need for shared integration environments, the slowest and flakiest place to test. |
| **Resilience (Topic 8)** | What happens when the provider is slow or down (503 vs 500, timeouts, retries) is integration behaviour. |
| **Security (Topic 9)** | Status codes, error messages and input validation are part of an API's attack surface. |
| **Observability (Topic 10)** | Correlation ids (`x-request-id`) let you follow one request across services in logs and traces. |

## 7. Real-world examples

**1. The reservation that couldn't be cancelled (this repo).** The shop's client reads `body.id`; the inventory service sends `reservationId`. Reserving works, because stock is held and the order succeeds. The shop stores `reservationId: undefined`. When the order is cancelled, the client calls `DELETE /reservations/undefined`, gets a 404, and treats it as "already released". The stock never comes back. Every unit test passed, because Topic 3's fake inventory returned its own ids and never went near the client. The consumer contract test *also* passed, because it encoded the consumer's wrong assumption. Only provider verification or a real integration test sees it.

**2. 500 for the client's mistake (this repo).** Broken JSON or a 20 KB body makes Express raise a 400 or 413, and the shop's error handler turns both into 500 `internal error`. Clients retry what they think is a server failure, monitoring pages the on-call engineer, and the response isn't in the API contract. Schema-checking responses for *bad* requests finds it in minutes.

**3. Mars Climate Orbiter (1999), revisited.** Topic 1 used it: one component produced pound-force seconds, the other expected newton-seconds. That is a contract failure. Each side was correct by its own specification; nothing checked that the two agreed.

**4. Breaking a public API by "fixing" it.** Many platform teams have shipped what they thought was a harmless change, such as stricter validation, a corrected status code or a field turned from string to number, and broken integrators who depended on the old behaviour (Hyrum's Law). Mature API providers run consumer-like contract suites and announce changes with deprecation periods.

**5. Contract testing at scale.** Organisations with hundreds of microservices often report the same arc: a shared staging environment that's always broken, slow cross-team release coordination, and then a move to consumer-driven contracts with a broker and `can-i-deploy` gates, so each team can release independently. Pact is used this way across banking, retail and government services.

## 8. Scaling across applications and teams

| Challenge | What works |
|---|---|
| Dozens of services and teams | A **Pact Broker** (open source) or PactFlow as the source of truth for contracts and verification results; `can-i-deploy` in every deployment pipeline |
| Provider breaks a consumer it didn't know about | **Webhooks**: a new consumer contract triggers the provider's verification build |
| New consumer expectations block the provider's build | **Pending pacts** and **WIP pacts**: new expectations are verified but don't fail the provider until they've passed once |
| Several versions in production | Tag or record deployments and environments per version; verify against the versions actually deployed |
| Public API with unknown consumers | Provider-driven: OpenAPI as the contract, schema-validated responses, schema-based fuzzing, deprecation policy |
| Shared test environments keep breaking | Shift integration confidence into contracts plus narrow integration tests; keep a small E2E smoke suite (Topics 5 and 7) |

## 9. Security and data privacy

- **Contracts are documentation.** Pact files and OpenAPI documents describe your internal APIs. Keep the broker access-controlled; don't publish internal contracts publicly.
- **No production data in contracts or provider states.** Use invented examples (`res-1`, `ada@example.com`). Contract files are copied into many pipelines.
- **Error handling is a security surface.** Stack traces or internal messages in 500 responses leak implementation details; the shop's handler correctly hides them. A 4xx should say what was wrong with the *request*, never with the server.
- **Validate at the boundary.** Accepting `bookId: "3"` is harmless here; the same leniency elsewhere (types, lengths, extra fields) is how injection and mass-assignment bugs start. Test invalid partitions on every API (Topic 9 goes deeper).
- **Body size limits are protection.** The shop limits JSON bodies to 10 KB; the lab makes sure exceeding that is a proper 413, not a crash.
- **Telemetry.** Pact sends anonymous usage statistics by default. This repo turns that off with `PACT_DO_NOT_TRACK` (`no-telemetry.js`). Check the defaults of every tool you add.

## 10. Performance, maintenance, and cost

| Concern | Guidance |
|---|---|
| **Speed** | In-process API and integration tests here take milliseconds each; contract verification about a second. Keep them in the main pipeline. |
| **Flakiness** | Port 0, a reset to a known state before each test, and no shared environments remove most integration flakiness. |
| **Contract maintenance** | Matchers (`like`, `regex`) instead of exact values keep contracts stable when data changes. Contract only what the consumer really uses. |
| **Provider states** | They're code: keep them few, named in business terms, and reviewed with the provider team. |
| **Schema drift** | Validate responses against OpenAPI in tests, so the document can't silently fall behind the code. Undocumented endpoints are drift too. |
| **Cost of not doing it** | Every interface bug found in staging costs a cross-team investigation; found in production, an incident. Contract checks find them per commit. |

## 11. Common problems and failure scenarios

| Problem | Symptom | Fix |
|---|---|---|
| **The consumer contract encodes the bug** | Consumer tests green, integration broken | Provider verification is the half that catches it; never run only one side |
| **Over-specified contracts** | Provider can't change anything without breaking verification | Match on type and shape; only include fields the consumer uses |
| **Contract tests used as functional tests** | Huge contracts testing provider business rules | Contracts check the interface; the provider's own tests check its logic |
| **Unchecked doubles** | Fakes and stubs drift from reality | Verify them against the provider (contracts), or derive them from the contract |
| **Shared staging as the only integration check** | "Staging is broken again"; blocked releases | Narrow integration tests and contracts in each pipeline |
| **5xx for client errors** | False alarms, retries, confused clients | Map validation and parse errors to 4xx; test bad requests explicitly |
| **Ignoring side effects** | API says OK but downstream state is wrong | Assert on the other system's state, as the integration test does |
| **Undocumented endpoints** | Clients use APIs nobody owns or tests | Validate against the spec; fail when a route isn't in it |

## 12. Important trade-offs

- **Contract tests vs integration tests.** Contracts are fast, independent and scale across teams, but only check the interface. Integration tests check real behaviour together, but need both sides running. Use contracts for every consumer–provider pair, and a few narrow integration tests for the riskiest flows.
- **Consumer-driven vs provider-driven.** Consumer-driven contracts know what's used, but need cooperation and a broker. Provider-driven contracts work for unknown consumers, but can't tell which changes are safe.
- **Strict vs tolerant.** Strict request validation protects the provider from accidental contracts; tolerant reading keeps consumers resilient to additive changes. Do both: strict in, tolerant out.
- **In-process vs deployed.** In-process tests are fast and controllable; tests against a deployed instance check configuration and wiring. Most edge cases belong in-process; a smoke run belongs against the deployed service.
- **Mocking at the HTTP level vs in code.** HTTP-level stubs exercise your real client (serialisation, headers, error handling); in-code doubles are simpler but skip the client entirely, which is where this lab's bug lived.

## 13. Comparisons

### API testing tools

| Tool | Style | Notes |
|---|---|---|
| **node:test + fetch** (Topic 4 lab) | Code, in-process | No extra dependencies; full control |
| **Playwright `request`** (`labs/04-integration-contract/api/`) | Code, out-of-process | Same runner and reports as the E2E suite |
| **Supertest** | Code, in-process (Node) | Calls an Express app without opening a port |
| **REST Assured** | Code (Java) | Fluent given/when/then DSL |
| **Karate** | DSL (Gherkin-like) | API, mocks and performance in one tool; readable by non-developers |
| **Postman + Newman** | GUI collections, CLI runner | Great for exploration and sharing; collections can become hard to review in code review |

### Contract testing tools

| Tool | Approach | Notes |
|---|---|---|
| **Pact** (used here) | Consumer-driven; many languages; HTTP and messages | Open-source broker; the de-facto standard |
| **PactFlow** | Pact plus bi-directional contracts (OpenAPI) | Commercial, hosted |
| **Spring Cloud Contract** | Provider-driven contracts in Groovy/YAML, generating tests and stubs | JVM ecosystem |
| **Specmatic** | OpenAPI as an executable contract: tests and stubs from the spec | Provider-driven |
| **Schemathesis / Dredd** | Generate requests from OpenAPI and check responses | Finds spec drift and crashes; not consumer-aware |

### Ways to check service compatibility

| Approach | Finds interface bugs | Speed | Needs both running | Scales to many teams |
|---|---|---|---|---|
| Unit tests with doubles | ✖ | ⚡⚡⚡ | No | ✔ |
| Contract tests | ✔ | ⚡⚡ | No | ✔ |
| Narrow integration tests | ✔ | ⚡⚡ | Yes (in the test) | ~ |
| Shared staging E2E | ✔ (eventually) | 🐢 | Yes (everything) | ✖ |
