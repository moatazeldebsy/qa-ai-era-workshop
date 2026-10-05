# Topic 7 · Quiz & wrap-up

## Quiz

Ten questions about understanding, not recall. Pick an answer to see whether it's right and why. Your best score is saved on this device.

<div class="quiz" data-quiz="07" markdown>

<div class="quiz-q" markdown>

**1. Three tests pass one at a time against a shared environment and fail when run in parallel. What's the most likely cause?**

- [ ] The environment is too slow
- [x] They read and change the same data, so each one invalidates the others' assumptions
- [ ] Parallel test runners are unreliable
- [ ] The tests have no assertions

<div class="quiz-why" markdown>
Shared mutable data makes a test's outcome depend on what other tests are doing at the same moment. Test-owned data removes the dependency.
</div>

</div>

<div class="quiz-q" markdown>

**2. Why doesn't "reset the data before each test" fix interference in a shared environment?**

- [ ] Resets are too slow
- [x] A reset run by one test wipes data another test is using at that moment
- [ ] Databases can't be reset
- [ ] It does fix it

<div class="quiz-why" markdown>
Resets give isolation only when tests run one after another in an environment nobody else uses. In parallel, a reset is just another collision.
</div>

</div>

<div class="quiz-q" markdown>

**3. A report's tests pass with three hand-made delivered orders, but it counts refunds as revenue. What would most likely have found this earlier?**

- [ ] More assertions on the same fixture
- [x] Generated data with a realistic mix of order states, checked against a property
- [ ] A faster test runner
- [ ] Mocking the report

<div class="quiz-why" markdown>
Hand-made fixtures contain only the cases their author thought of. Realistic generated data brings the cases they didn't.
</div>

</div>

<div class="quiz-q" markdown>

**4. Why should a test data generator take a seed?**

- [ ] Seeds make data more realistic
- [x] The same seed reproduces the same data, so a failure found with it can be replayed and debugged
- [ ] Seeds are required by law
- [ ] To make data generation faster

<div class="quiz-why" markdown>
Random data finds more; seeded random data finds more *and* lets you come back to what it found. Log the seed with every run.
</div>

</div>

<div class="quiz-q" markdown>

**5. A masking script replaces emails with `sha256(email)`. What's wrong with that?**

- [ ] SHA-256 is too slow
- [x] Anyone with a list of customer emails can hash it and match the results, so the pseudonyms are reversible
- [ ] Hashes can't be joined
- [ ] Nothing: hashing is anonymisation

<div class="quiz-why" markdown>
An unkeyed hash is a dictionary lookup away from the original. A keyed hash (HMAC) can only be reproduced by whoever holds the key.
</div>

</div>

<div class="quiz-q" markdown>

**6. Why must the same customer get the same pseudonym in the customers and orders tables?**

- [ ] For performance
- [x] So joins still work: otherwise the masked data is useless for testing, and people go back to raw copies
- [ ] Because GDPR requires it
- [ ] It doesn't matter

<div class="quiz-why" markdown>
Masking must keep referential integrity. Useless masked data is a quiet push towards unsafe practices.
</div>

</div>

<div class="quiz-q" markdown>

**7. Under GDPR, is keyed-pseudonymised customer data still personal data?**

- [x] Yes: whoever holds the key can re-identify people, so it remains personal data
- [ ] No: once hashed, it's anonymous
- [ ] Only if it contains names
- [ ] Only in production

<div class="quiz-why" markdown>
Pseudonymisation reduces risk but doesn't take data out of the regulation. Only truly anonymised data does, and that is hard to achieve.
</div>

</div>

<div class="quiz-q" markdown>

**8. The inventory service has a `PUT /stock` endpoint for test data. What's the safe way to ship it?**

- [ ] Always enabled, behind obscurity
- [x] Off by default, enabled only by explicit configuration in test environments, with a check that production has it off
- [ ] Remove it and copy production data instead
- [ ] Enable it in production for easier debugging

<div class="quiz-why" markdown>
Test conveniences are attack surfaces. Make them opt-in, and treat "is it off in production?" as something to test.
</div>

</div>

<div class="quiz-q" markdown>

**9. What's the main benefit of an ephemeral environment per pull request over one shared staging environment?**

- [ ] It's always cheaper
- [x] Each change is tested in isolation, so teams don't break each other's tests or queue for the environment
- [ ] It has production data
- [ ] It never needs configuration

<div class="quiz-why" markdown>
Ephemeral environments remove interference and drift. Combined with contracts (Topic 4), they replace most uses of shared staging.
</div>

</div>

<div class="quiz-q" markdown>

**10. A masked export keeps city, postcode and exact order dates. Why might that still identify people?**

- [ ] It can't: no names are left
- [x] Quasi-identifiers combine: in a small dataset, a postcode plus dates and amounts can single out one person
- [ ] Postcodes are encrypted
- [ ] Only if the export is public

<div class="quiz-why" markdown>
Re-identification by combining attributes is well documented (Sweeney's ZIP + birth date + sex; the Netflix Prize data). Generalise or perturb where it matters.
</div>

</div>

</div>

## Wrap-up

### Mental model

> **A test is an experiment, the environment is the lab, and the data is the sample.**
>
> A contaminated lab (shared mutable state) ruins experiments that are individually correct. An unrepresentative sample (hand-made fixtures only) produces confident, wrong conclusions. An unrecorded sample (unseeded random data) produces findings nobody can reproduce. And a sample taken from real people (production data) comes with obligations. Isolate the lab, make the sample representative and reproducible, and keep real people out of it.

### 10 key things to remember

1. **Same code, different configuration** across every environment.
2. **Prefer ephemeral environments** over long-lived shared ones; throw them away.
3. **Tests own their data.** Unique records per test make parallel runs safe, even in shared environments.
4. **Resets don't isolate parallel tests.** They're just another writer.
5. **Generate data from the domain model** so it's valid by construction.
6. **Use realistic distributions:** cancellations, refunds, edge values, not just the happy path.
7. **Seed every generator and log the seed.** Reproducibility is debuggability.
8. **Synthetic first; masked production data only with a real need.**
9. **Mask properly:** keyed pseudonyms, consistent across tables, scrubbed free text, quasi-identifiers considered.
10. **Test conveniences are attack surfaces:** opt-in, off in production, and checked.

### Common mistakes

- One shared staging environment as the main place integration is tested.
- Tests that depend on seed data other tests change.
- `Math.random()` in test data with no seed.
- Fixtures that only contain the happy path.
- Copying production databases into test "just for now".
- Hashing without a key and calling it anonymisation.
- Masking each table separately, so joins break.
- Forgetting free-text fields, logs and attachments.
- Debug or test-data endpoints reachable in production.

### Hands-on challenge

**Turn the generator into a test-data service.**

1. Add `GET /test-data/orders?count=&seed=` to the inventory service's test-data API (still opt-in), returning `generateOrders` output, so other teams can fetch the same reproducible histories.
2. Write a property test for `salesReport` using fast-check (Topic 2) with *generated seeds*: for any seed, revenue equals the sum of totals of kept orders. Log the seed on failure.
3. Extend `pii-scan.mjs` to flag **quasi-identifiers**: report any combination of city + postcode that occurs only once in the masked customers (a k-anonymity check with k = 2). Then generalise postcodes until the check passes.
4. **Stretch:** run `npm run test:e2e` against the Docker Compose environment (`BASE_URL=http://localhost:3210`). Which tests behave differently, and why?

Share your quasi-identifier check in the discussions. There's more than one sensible definition.

### What to learn next

**Topic 8 — Performance, Load, and Resilience Testing.** Your environments and data can now scale. Topic 8 asks how the system behaves under load and when things go wrong: latency percentiles, load profiles, capacity, and what the shop does when the inventory service is slow or down.

Read before Topic 8 (optional):

- Adam Wiggins, [*The Twelve-Factor App*](https://12factor.net/): config, backing services, dev/prod parity
- UK ICO, [*Anonymisation, pseudonymisation and privacy enhancing technologies guidance*](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/anonymisation/)
- Latanya Sweeney, *Simple Demographics Often Identify People Uniquely* (2000)

When you've finished the lab and the challenge, move on to [Topic 8](../08-performance/index.md).
