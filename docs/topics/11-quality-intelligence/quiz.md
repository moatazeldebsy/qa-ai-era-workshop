# Topic 11 · Quiz & wrap-up

## Quiz

Ten questions about understanding, not recall. Pick an answer to see whether it's right and why. Your best score is saved on this device.

<div class="quiz" data-quiz="11" markdown>

<div class="quiz-q" markdown>

**1. A report based on the latest run says a test is "failing" today and "fine" tomorrow, on the same code. What is it missing?**

- [ ] A faster runner
- [x] History: only results across runs reveal that the test is flaky
- [ ] More assertions
- [ ] A screenshot

<div class="quiz-why" markdown>
One run is an anecdote. Flakiness is defined by different outcomes on the same code, which needs several runs.
</div>

</div>

<div class="quiz-q" markdown>

**2. With `retries: 1`, a test fails and then passes on retry. What does JUnit XML typically show?**

- [ ] A failure
- [x] A pass: failures="0", with no standard way to mark the retry
- [ ] A skipped test
- [ ] An error

<div class="quiz-why" markdown>
JUnit has no standard for retries. Runner-native reports (like Playwright's JSON with status 'flaky') keep the information.
</div>

</div>

<div class="quiz-q" markdown>

**3. A test fails in every one of 20 runs on a commit. Is it flaky?**

- [ ] Yes: it fails a lot
- [x] No: it's consistently failing, which needs a different response (likely a real regression or a broken test)
- [ ] Only if it has retries
- [ ] Only on CI

<div class="quiz-why" markdown>
Flaky means different outcomes on the same code. Treating a real regression as "just flaky" lets bugs through.
</div>

</div>

<div class="quiz-q" markdown>

**4. MTTD is 34.8 minutes as a mean and 4.5 minutes as a median. What's the best interpretation?**

- [ ] The data is wrong
- [x] Most incidents are detected fast, and a few (customer-reported) take very long and pull up the mean
- [ ] The mean is always correct
- [ ] Detection is getting worse

<div class="quiz-why" markdown>
Skewed data needs medians and breakdowns. Here the breakdown by detection source points at the real improvement: catch what customers currently report.
</div>

</div>

<div class="quiz-q" markdown>

**5. Why does measuring MTTR from incident start rather than detection matter?**

- [ ] It doesn't: both are the same
- [x] Customers are affected from the start; measuring from detection hides slow detection
- [ ] It makes the number smaller
- [ ] DORA forbids measuring from detection

<div class="quiz-why" markdown>
Definitions are design decisions. Publish the one you use, and choose it for the question you're answering.
</div>

</div>

<div class="quiz-q" markdown>

**6. What does Goodhart's law warn about?**

- [ ] Metrics are always useless
- [x] When a measure becomes a target, people optimise the measure instead of the outcome
- [ ] Averages are better than medians
- [ ] Only managers should see metrics

<div class="quiz-why" markdown>
Coverage targets breed assertion-free tests; bug counts breed late testing. Balance metrics and use them for learning.
</div>

</div>

<div class="quiz-q" markdown>

**7. Which pair of DORA metrics balances speed with stability?**

- [ ] Lead time and deployment frequency
- [x] Deployment frequency and change failure rate
- [ ] Coverage and pass rate
- [ ] MTTD and MTTR

<div class="quiz-why" markdown>
Speed metrics (frequency, lead time) are paired with stability metrics (change failure rate, time to restore). DORA found good teams improve both.
</div>

</div>

<div class="quiz-q" markdown>

**8. What is a quarantine for flaky tests, done well?**

- [ ] Deleting flaky tests
- [x] Moving them out of the blocking path while they still run and report, each with an owner and a deadline
- [ ] Hiding them from reports
- [ ] Running them only once a year

<div class="quiz-why" markdown>
Quarantine restores trust in the build without losing the test. Without owners and deadlines it becomes a graveyard.
</div>

</div>

<div class="quiz-q" markdown>

**9. The two slowest tests in the report are `test.fail()` known-bug tests. Why are they slow?**

- [ ] Playwright runs them twice
- [x] An expected failure waits for its assertion's full timeout before failing, every run
- [ ] They test more features
- [ ] They're flaky

<div class="quiz-why" markdown>
Recording known bugs as tests is right, but each costs time until the bug is fixed: a reason to fix known bugs quickly.
</div>

</div>

<div class="quiz-q" markdown>

**10. Why should test results stored for analysis be scrubbed?**

- [ ] To make files smaller
- [x] Messages, logs, screenshots and paths can contain tokens, personal data and usernames
- [ ] JUnit requires it
- [ ] They don't need scrubbing

<div class="quiz-why" markdown>
This lab's fixtures had local file paths, with a username, removed before being committed. Treat results as data with a retention policy.
</div>

</div>

</div>

## Wrap-up

### Mental model

> **Quality intelligence is evidence over time, defined honestly, aimed at a decision.**
>
> Keep every run's results with their context, not just the latest. Choose formats that don't throw information away. Define every metric and show it next to its number. Separate "always failing" from "sometimes failing". Report to a real audience, with a real question, and end with an owner and an action. Then check next month whether the action worked.

### 10 key things to remember

1. **History, not the latest run.** Flakiness, trends and regressions only show over time.
2. **Flaky ≠ failing.** Different outcomes on the same code, versus failing every time.
3. **Retries hide evidence.** Keep runner-native results (attempts, `flaky` status) alongside JUnit.
4. **Stable test ids** keep history connected across renames.
5. **Every metric needs a definition,** and different definitions answer different questions.
6. **Medians and breakdowns** for skewed data like detection times.
7. **DORA pairs speed with stability;** use it to improve a team, not to rank teams.
8. **Goodhart's law:** balance metrics, measure outcomes, don't target activities.
9. **Quarantine with owners and deadlines,** or it becomes a graveyard.
10. **Reports end in decisions:** fix, quarantine, invest, release.

### Common mistakes

- Judging test health from the last run.
- Treating JUnit counts as the truth when retries are on.
- Undefined, or silently changed, metric definitions.
- Means of skewed data on the headline dashboard.
- Coverage or test-count targets.
- Metrics about individual people.
- Dashboards without a question or an owner.
- Quarantines without deadlines.
- Storing results with secrets and personal data in them.

### Hands-on challenge

**Close the loop with the quality gate.**

1. Make the Topic 6 quality gate read Playwright's JSON report as well as JUnit, and add a `maxFlaky` threshold (for example 0 for critical suites). Show it blocking a run where a test passed only on retry.
2. Add **failure clustering** to `analyze.mjs`: normalise failure messages (remove numbers, ids, durations, paths) into signatures, and report "N failures, M causes". Test it with two runs whose messages differ only in a number.
3. Write a **flaky quarantine**: a `quarantine.json` list (test id, owner, deadline), honoured by the gate (quarantined tests report but don't block), with a check that fails when a deadline has passed.
4. **Stretch:** add a week-over-week trend to the report: pass rate, flaky rate and suite duration per run date, from runs collected on different days.

Share your gate change in the discussions. How strict should `maxFlaky` be?

### What to learn next

**Topic 12 — AI in QA Engineering.** Two sides of one topic: using AI to test (generating tests, exploring with agents, triaging failures like the ones in this report) and testing AI (evaluating an LLM feature for grounding, hallucination, prompt injection and safety). You'll work with the shop's AI support assistant, the LLM evaluation and red-team suites, and an AI agent that tests the shop.

Read before Topic 12 (optional):

- Nicole Forsgren, Jez Humble and Gene Kim, *Accelerate*, chapters 2 and 3
- [DORA research](https://dora.dev/)
- John Micco, *Flaky Tests at Google and How We Mitigate Them* (Google Testing Blog, 2016)

When you've finished the lab and the challenge, move on to [Topic 12](../12-ai-in-qa/index.md).
