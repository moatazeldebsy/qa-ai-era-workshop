# Topic 3 — Unit and Component Testing

*How to check one piece of behaviour fast, in isolation, and in a way that would notice when it breaks.*

Topics 1 and 2 were about *what* to test. This topic is about writing those tests at the cheapest level, well. That means:

- deciding what a "unit" is
- replacing the slow and uncontrollable parts of the world (the network, the clock, other services) with **test doubles**
- writing tests first
- measuring whether the tests would actually catch a bug

The lab adds two new parts to Quality Books: a **returns service** that depends on the current time, and a **checkout** that reserves stock, charges a card and sends an email. Both have 100% line and branch coverage. Both have real bugs. By the end you'll have found and fixed them, built a coupon module test-first, and raised the mutation score from 82% to over 90%.

<div class="topic-progress" data-topic="03"></div>

## What you'll be able to do

- Explain sociable versus solitary tests, and choose between them.
- Pick the right test double (dummy, stub, spy, mock, fake) for each collaborator.
- Make time, randomness and other services controllable through injection.
- Recognise and fix common test smells.
- Practise the red–green–refactor cycle of test-driven development.
- Use coverage to find untested code and Stryker mutation testing to find weak tests.

## Before you start

Finish [Topics 1 and 2](../index.md) first; this topic uses their oracles, boundaries and mutants. Run `npm install` again if you set up before Topic 3: it adds Stryker.

## How to work through this topic

| Page | What you do | Time |
|---|---|---|
| [Concepts](concepts.md) | Read sections 1–13: units, doubles, seams, time, TDD, coverage, mutation testing | ~2.5 h |
| [Lab](lab.md) | Clean up smelly tests, fix a time-zone bug and a checkout bug, build coupons test-first, raise the mutation score | ~2.5 h |
| [Quiz & wrap-up](quiz.md) | Check your understanding, then take on the challenge | ~45 min |

```bash
npm run learn:start 3     # your own branch for this topic
npm run learn:check 3     # after each lab step: ✔ or what's missing
```

## What you'll come away with

- Two real bugs fixed in the shop: one in time arithmetic, one in error handling.
- A coupon module you built test-first, with your own test suite.
- A mutation report showing your tests now catch what coverage said they did.

!!! question "Stuck, or want to compare notes?"
    Ask in the [course discussions](https://github.com/moatazeldebsy/qa-engineering-deep-dive/discussions) under **Topic 03**. When you've finished, post your notebook or your challenge solution there too.
