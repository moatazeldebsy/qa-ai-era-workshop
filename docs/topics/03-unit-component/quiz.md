# Topic 3 · Quiz & wrap-up

## Quiz

Ten questions about understanding, not recall. Pick an answer to see whether it's right and why. Your best score is saved on this device.

<div class="quiz" data-quiz="03" markdown>

<div class="quiz-q" markdown>

**1. Your checkout tests mock `priceCart` along with the payment gateway. What's the main risk?**

- [ ] The tests will be slow
- [x] A pricing bug can't fail them, because the real pricing code never runs
- [ ] Mocks can't return numbers
- [ ] None: mocking everything is best practice

<div class="quiz-why" markdown>
`priceCart` is ours, fast and deterministic, so there's nothing to gain by replacing it and a lot to lose. Mock at architectural boundaries (network, time, other services), not your own cheap code.
</div>

</div>

<div class="quiz-q" markdown>

**2. A test needs the payment gateway to decline a card. Which double fits best?**

- [x] A stub that throws a decline
- [ ] A fake payment provider with accounts and balances
- [ ] A dummy
- [ ] A spy that records calls and always approves

<div class="quiz-why" markdown>
You need the collaborator to *say* something: a stub with a canned answer is the simplest double that does that. A fake would work, but costs more to build and maintain.
</div>

</div>

<div class="quiz-q" markdown>

**3. Why do the lab's date tests write timestamps like `2026-06-01T00:10:00+02:00` instead of `2026-06-01T00:10:00`?**

- [ ] It's shorter
- [x] Without an offset, the moment depends on the machine's time zone, so the test isn't repeatable
- [ ] Node can't parse dates without an offset
- [ ] To make the tests run faster

<div class="quiz-why" markdown>
`new Date('2026-06-01T00:10:00')` means 00:10 *local time*: a different instant on your laptop and on a UTC CI runner. Explicit offsets make the test mean the same thing everywhere.
</div>

</div>

<div class="quiz-q" markdown>

**4. `daysSinceDelivery` divided elapsed milliseconds by 24 hours. Why was that wrong for the returns policy?**

- [ ] Division is slow
- [x] The policy counts calendar days in Berlin; 23:30 on 1 May to 00:10 on 1 June is day 31 but only 30 periods of 24 hours
- [ ] JavaScript dates are always in UTC
- [ ] It ignored leap years

<div class="quiz-why" markdown>
Elapsed time and calendar days differ whenever the times of day differ, and on the days the clocks change. The policy, and the customer, think in calendar dates.
</div>

</div>

<div class="quiz-q" markdown>

**5. A test does `try { doThing(); } catch (e) { assert.match(e.message, /stock/); }`. What's wrong with it?**

- [ ] Nothing
- [x] If `doThing()` stops throwing, the test still passes
- [ ] `assert.match` can't be used in a catch block
- [ ] It will always fail

<div class="quiz-why" markdown>
The only assertion is in the `catch`. If no error is thrown, nothing is asserted and the test is green. Use `assert.throws` (or `assert.rejects` for async code).
</div>

</div>

<div class="quiz-q" markdown>

**6. `checkout.js` had 100% line and branch coverage and still contained two bugs. What does that show?**

- [ ] The coverage tool was broken
- [x] Coverage measures what ran, not whether the tests would notice a wrong result
- [ ] Branch coverage is stricter than mutation testing
- [ ] Bugs can't hide in covered code

<div class="quiz-why" markdown>
Coverage answers *what did we not run?* Mutation testing answers *would we notice a bug?* The surviving mutants pointed at exactly the weak assertions.
</div>

</div>

<div class="quiz-q" markdown>

**7. In TDD, why must you watch the new test fail before writing the code?**

- [ ] It's a ritual with no technical purpose
- [x] It proves the test can fail, so it's actually testing something
- [ ] Failing tests run faster
- [ ] So that coverage drops first

<div class="quiz-why" markdown>
A test you've never seen fail might be asserting nothing, or testing the wrong function. Red first is a cheap check of the test itself.
</div>

</div>

<div class="quiz-q" markdown>

**8. The interaction test checked that `charge()` was called once, and stayed green while customers were overcharged. What would fix it?**

- [ ] Check that `charge()` was called exactly twice
- [x] Assert the amount that was charged
- [ ] Mock `priceCart` as well
- [ ] Add a retry

<div class="quiz-why" markdown>
Verify commands by *what* they were asked to do, not just *that* they were called. One assertion on the amount turns it into a test that notices.
</div>

</div>

<div class="quiz-q" markdown>

**9. Stryker reports a surviving mutant `newId = () => undefined` in the default parameter. Every test injects its own `newId`. What's the right call?**

- [ ] Always kill every mutant to reach 100%
- [x] Judge its risk: the default is untested by design, so it's low value; document it or add one small test
- [ ] Delete the default parameter so Stryker can't mutate it
- [ ] Turn mutation testing off

<div class="quiz-why" markdown>
Mutation score is a guide, not a goal. Kill the survivors that would hide a real bug; for low-value or equivalent ones, a written reason is enough.
</div>

</div>

<div class="quiz-q" markdown>

**10. Which change makes code that calls `new Date()` inside a function easiest to test?**

- [ ] Run the tests at a fixed time of day
- [x] Pass a clock in, with `() => new Date()` as the default
- [ ] Round all dates to the nearest day
- [ ] Use UTC everywhere in production

<div class="quiz-why" markdown>
An injected clock is an explicit seam: each test sets the moment it needs, tests can run in parallel, and production keeps the default. Fake timers also work, but they are global and hide the dependency.
</div>

</div>

</div>

## Wrap-up

### Mental model

> **A unit test is a controlled experiment.**
>
> Isolate the behaviour from everything you can't control: the clock, the network, other teams. Replace those with doubles that can *also fail*. Run it in milliseconds. And measure the experiment itself: a test that can't fail when the code is wrong isn't an experiment, it's a ritual.

Coverage tells you where you never ran an experiment. Mutation testing tells you which experiments couldn't have detected anything.

### 10 key things to remember

1. **"Unit" means a unit of behaviour.** Use real collaborators when they're fast and deterministic; double the slow and uncontrollable ones.
2. **FIRST:** fast, independent, repeatable, self-validating, timely.
3. **Stub queries, verify commands.** And verify *what* a command was asked to do, not only that it was called.
4. **Don't mock what you don't own, or what's cheap.** Contract tests (Topic 4) check the doubles you do need.
5. **Inject the clock, randomness and services.** A default parameter is the cheapest seam there is.
6. **Time is a domain.** Calendar days, time zones, DST and inclusive boundaries are requirements, so test them on purpose.
7. **Give every double a failure mode.** The bugs live on the error paths.
8. **See red before green.** A test you've never seen fail might test nothing.
9. **Coverage finds untested code; mutation testing finds weak tests.** Use both, and gate on neither blindly.
10. **Test smells are bugs in the tests.** Shared state, silent catches and logic in tests cost more than they save.

### Common mistakes

- Mocking every collaborator, including your own pure functions.
- Asserting only that mocks were called (interaction tests with no outcome).
- `new Date()` or `Math.random()` inside the code under test, with no seam.
- Timestamps without offsets in test data.
- Forgetting `await` in async tests, so assertions run after the test has "passed".
- Putting the only assertion inside a `catch`.
- Doubles that can only succeed, so error paths are never tested.
- Writing tests after the fact that mirror the implementation line by line.
- Treating 100% coverage, or 100% mutation score, as the goal instead of a guide.

### Hands-on challenge

**Coupons meet the checkout.**

1. Extend `createCheckout` so `placeOrder` accepts an optional `couponCode`. The discount comes off the subtotal **before** the free-shipping check. Write down that decision as a test name before you write any code.
2. Inject `applyCoupon`? Or use it directly? Decide using section 4.2 ("don't mock what's cheap"), and write one sentence in your notebook explaining why.
3. Test-drive it: a valid coupon, an unknown coupon (should the order fail, or go ahead without a discount?), a coupon that drops the subtotal below 50 EUR so shipping is charged again, and SUMMER26 on 31 August at 23:59 and on 1 September at 00:01, Berlin time.
4. Add `app/src/coupons.js` to Stryker's `mutate` list and get the combined score above 90%.
5. Share your answer to step 2 in the discussions. There are good arguments both ways.

### What to learn next

**Topic 4 — Integration, API, and Contract Testing.** Your doubles encode assumptions: the inventory reserves and releases, and the payment gateway throws when it declines. Topic 4 checks those assumptions against the real thing. You'll test the HTTP API in-process and over the network, validate it against its OpenAPI contract, and use consumer-driven contract tests (Pact) between the shop and a separate inventory service, so two teams can change their code independently without breaking each other.

Read before Topic 4 (optional):

- Martin Fowler, [*Mocks Aren't Stubs*](https://martinfowler.com/articles/mocksArentStubs.html)
- Michael Feathers, *Working Effectively with Legacy Code*, chapters on seams
- Kent Beck, *Test-Driven Development: By Example*, part I
- Goran Petrović and Marko Ivanković, *State of Mutation Testing at Google* (ICSE SEIP 2018)

When you've finished the lab and the challenge, move on to [Topic 4](../04-integration-contract/index.md).
