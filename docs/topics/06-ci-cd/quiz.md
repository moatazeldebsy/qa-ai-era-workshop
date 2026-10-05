# Topic 6 · Quiz & wrap-up

## Quiz

Ten questions about understanding, not recall. Pick an answer to see whether it's right and why. Your best score is saved on this device.

<div class="quiz" data-quiz="06" markdown>

<div class="quiz-q" markdown>

**1. What's the difference between continuous delivery and continuous deployment?**

- [ ] There is none
- [x] With delivery every passing change is releasable and a person decides when; with deployment every passing change goes to production automatically
- [ ] Delivery is for front ends, deployment for back ends
- [ ] Deployment skips testing

<div class="quiz-why" markdown>
Both rely on the same pipeline and evidence. The difference is whether the final step, releasing, is a human decision or automatic.
</div>

</div>

<div class="quiz-q" markdown>

**2. A pipeline has six stages that each take 3 minutes and all wait for the one before. Four of them only need the code. What limits how fast it can get?**

- [ ] The number of runners only
- [x] The critical path: the longest chain of stages that truly depend on each other
- [ ] The slowest single test
- [ ] Nothing: with enough machines it takes 3 minutes

<div class="quiz-why" markdown>
Once independent stages run in parallel, the remaining chain of real dependencies sets the floor. More machines beyond that buy nothing.
</div>

</div>

<div class="quiz-q" markdown>

**3. Why should the quality gate stage run even when a test stage fails?**

- [ ] To retry the failed tests
- [x] So the pipeline still ends with one clear verdict and its reasons
- [ ] To deploy anyway
- [ ] It shouldn't: it should be skipped

<div class="quiz-why" markdown>
A skipped gate gives no reason. Running it always (GitHub Actions: `if: always()`) turns a red build into an explained decision.
</div>

</div>

<div class="quiz-q" markdown>

**4. Import-based impact analysis selects no suites for a change to `app/public/app.js`. Why?**

- [ ] The file has no tests
- [x] Browser tests reach the front end over HTTP through the running app; no test imports the file
- [ ] The analysis is broken
- [ ] Front-end code can't be tested

<div class="quiz-why" markdown>
Static graphs only see static dependencies. Runtime dependencies (HTTP, config, data) need explicit rules, and the full suite should still run on main.
</div>

</div>

<div class="quiz-q" markdown>

**5. The course's quality gate reported READY with 37 of 38 tests skipped. What's the underlying problem?**

- [ ] The tests were flaky
- [x] The gate counted failures but not skipped tests, so evidence could shrink to almost nothing
- [ ] JUnit can't record skipped tests
- [ ] Nothing: skipped tests are fine

<div class="quiz-why" markdown>
A gate must resist gaming, including the innocent kind ("skip it for now"). Limit or at least report skipped tests.
</div>

</div>

<div class="quiz-q" markdown>

**6. Your gate reads `test-results/k6-summary.json` from three days ago, and the code changed yesterday. What should it do?**

- [ ] Pass: the numbers were good
- [x] Treat the evidence as stale and block (or demand a re-run): it describes code that no longer exists
- [ ] Average old and new results
- [ ] Ignore performance entirely

<div class="quiz-why" markdown>
Evidence must be newer than the code it vouches for. Better still, evidence should carry provenance: the commit and run that produced it.
</div>

</div>

<div class="quiz-q" markdown>

**7. Running stages in parallel made each stage slower, yet the whole pipeline faster. Why?**

- [ ] Measurement error
- [x] Parallel stages compete for the same CPUs and memory, but overlapping them still shortens the total
- [ ] Parallel stages run fewer tests
- [ ] Node.js is single-threaded

<div class="quiz-why" markdown>
Concurrency trades per-stage speed for total throughput. Past the number of cores, adding parallel stages stops helping.
</div>

</div>

<div class="quiz-q" markdown>

**8. What is the safest way to use retries for flaky tests in CI?**

- [ ] Retry up to five times so builds stay green
- [x] At most one retry, with passed-on-retry tests reported as flaky and fixed or quarantined with an owner
- [ ] Never run flaky tests
- [ ] Retry only on the main branch

<div class="quiz-why" markdown>
One visible retry keeps the pipeline moving without hiding the problem. Invisible retries turn a test suite into noise.
</div>

</div>

<div class="quiz-q" markdown>

**9. A canary release sends 5% of traffic to the new version. What makes it a testing strategy?**

- [ ] It's faster to deploy
- [x] The new version's error rate and latency are compared with the old one on real traffic before the rollout widens
- [ ] It replaces automated tests
- [ ] Only 5% of users can find bugs

<div class="quiz-why" markdown>
Progressive delivery extends the pipeline into production: real traffic is the test input, and metrics are the oracle.
</div>

</div>

<div class="quiz-q" markdown>

**10. Which practice best protects a pipeline from supply-chain attacks through third-party actions?**

- [ ] Using the `@main` tag so you always get fixes
- [x] Pinning actions to a full commit SHA and reviewing updates
- [ ] Giving the workflow write permissions everywhere
- [ ] Running every action as root

<div class="quiz-why" markdown>
A tag can be moved to malicious code; a commit SHA can't. Combine pinning with least-privilege `permissions:`.
</div>

</div>

</div>

## Wrap-up

### Mental model

> **A pipeline is a dependency graph that produces evidence, and a gate is a function from evidence to a decision.**
>
> Make the graph honest: only real dependencies, fastest feedback first, everything else in parallel. Make the evidence trustworthy: complete, fresh, from this version of the code, and hard to game. Then the decision becomes boring, which is exactly what you want from a release.

### 10 key things to remember

1. **Small batches, fast feedback.** Frequent integration is safer, not riskier.
2. **Pipelines are graphs.** Model real dependencies; the critical path sets your floor.
3. **Fast, informative checks first;** expensive ones only when the cheap ones pass.
4. **The gate always runs** and always explains its verdict.
5. **Evidence must be fresh and from this version.** Stale or partial results approve untested code.
6. **Skipped tests are evidence too.** Limit them or report them loudly.
7. **Impact analysis has blind spots.** Selective on pull requests, full on main.
8. **One visible retry, at most.** Flaky passes are reported and owned.
9. **Same commands locally and in CI.** A red build should be one command away from reproduction.
10. **Deployment is part of testing:** canaries, flags and staged rollouts limit the blast radius of what tests missed.

### Common mistakes

- Running everything one after another "to be safe".
- Skipping the gate when tests fail, so nobody sees why.
- Trusting whatever is in the results folder.
- Selective testing with no full run as a safety net.
- Retrying until green.
- Pipelines that only run in CI, with commands nobody can run locally.
- Unpinned third-party actions and over-privileged tokens.
- Gate thresholds that were never agreed, and so are always argued about.

### Hands-on challenge

**Make the course's real CI faster and safer.**

1. `.github/workflows/ci.yml` runs everything in one job. Split it into jobs that mirror your `pipeline.json`: a fast `unit` job, parallel jobs for the topic labs and the browser tests, and a `gate` job that `needs` them all with `if: always()`. Pass evidence between jobs with `actions/upload-artifact` and `actions/download-artifact`. Run it in your fork and compare the duration in the Actions tab.
2. The `package.json` rule in `impact.config.json` is repeated for every suite. Add a `"suite": "*"` wildcard to `impact.mjs` and simplify the config.
3. Add **provenance** to the gate: make the pipeline write `test-results/run.json` with the commit SHA (`git rev-parse HEAD`), and make the gate refuse evidence whose run doesn't match.
4. **Stretch:** shard the browser stage in two (`--shard=1/2`, `--shard=2/2`), and merge the reports so the gate still gets one `junit.xml`.

Post your before and after Actions timings in the discussions.

### What to learn next

**Topic 7 — Test Environments and Test Data Management.** Your pipeline runs tests, but against what? Topic 7 is about the environments tests run in (local, ephemeral, staging) and the data they use: seeding, isolation between parallel tests, synthetic data, and masking production data safely.

Read before Topic 7 (optional):

- Martin Fowler, [*Continuous Integration*](https://martinfowler.com/articles/continuousIntegration.html)
- Jez Humble and David Farley, *Continuous Delivery*, chapter 5 (the deployment pipeline)
- Nicole Forsgren, Jez Humble and Gene Kim, *Accelerate*: the research behind the DORA metrics

When you've finished the lab and the challenge, move on to [Topic 7](../07-env-data/index.md).
