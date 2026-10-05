# Topic 13 · Quiz & wrap-up

## Quiz

Ten questions about understanding, not recall. Pick an answer to see whether it's right and why. Your best score is saved on this device.

<div class="quiz" data-quiz="13" markdown>

<div class="quiz-q" markdown>

**1. What is a "paved road" (or golden path)?**

- [ ] A mandatory process every team must follow
- [x] The supported, easiest way to do something that is also the right way; teams may leave it, but rarely want to
- [ ] A list of banned tools
- [ ] The production deployment pipeline only

<div class="quiz-why" markdown>
Platforms win by making the right thing the easy thing, not by mandating it.
</div>

</div>

<div class="quiz-q" markdown>

**2. Why turn standards (health checks, JSON errors, security headers) into a conformance kit?**

- [ ] To make documentation longer
- [x] So "does every service do X?" is answered automatically, across the fleet, on every change
- [ ] Because auditors require JavaScript
- [ ] To replace unit tests

<div class="quiz-why" markdown>
A standard nobody checks is a suggestion. The lab's fleet report showed 0 of 2 services meeting all five.
</div>

</div>

<div class="quiz-q" markdown>

**3. Two services each failed the same standards in different ways. What's the platform answer?**

- [ ] Ask each team to fix its own version
- [x] Implement the behaviour once in a shared baseline library and move services onto it
- [ ] Delete the standard
- [ ] Add a manual review step

<div class="quiz-why" markdown>
Fix once, in one place: two lines moved the inventory service from four failures to none.
</div>

</div>

<div class="quiz-q" markdown>

**4. Why is behaviour better shipped in a library than in a template?**

- [ ] Templates are slower
- [x] A template is copied once and drifts; a library can be updated for every service that depends on it
- [ ] Libraries don't need tests
- [ ] Templates can't contain code

<div class="quiz-why" markdown>
Templates are great for structure (folders, config, CI); behaviour that should improve over time belongs in versioned libraries.
</div>

</div>

<div class="quiz-q" markdown>

**5. The scaffolder accepted `../escape` as a service name. Why does that matter?**

- [ ] It doesn't: it's an internal tool
- [x] Internal tools run with broad permissions; it wrote outside services/ and could overwrite existing services
- [ ] Only because of disk space
- [ ] Because the name is ugly

<div class="quiz-why" markdown>
Platform code runs everywhere and multiplies its bugs. It needs input validation, tests and review like product code.
</div>

</div>

<div class="quiz-q" markdown>

**6. What does a GitHub reusable workflow (`on: workflow_call`) give a platform team?**

- [ ] Faster runners
- [x] One maintained set of CI steps that every service calls with its own inputs
- [ ] Free compute
- [ ] Automatic test generation

<div class="quiz-why" markdown>
Improving the reusable workflow improves every service, which is also why its changes need versioning and testing.
</div>

</div>

<div class="quiz-q" markdown>

**7. Express's default error handler sent an HTML page with a stack trace and file paths. What kind of problem is that?**

- [ ] Only a style problem
- [x] An information leak and an inconsistent API: clients get HTML instead of JSON, and attackers learn internals
- [ ] A performance problem
- [ ] Not a problem in development

<div class="quiz-why" markdown>
Default behaviour is a decision someone didn't make. A baseline makes the decision once: JSON errors, no internals.
</div>

</div>

<div class="quiz-q" markdown>

**8. In Team Topologies terms, what does a platform team do for quality?**

- [ ] Tests every team's product
- [x] Builds and runs self-service test infrastructure and paved roads that product teams use
- [ ] Approves every release
- [ ] Writes all the unit tests

<div class="quiz-why" markdown>
Stream-aligned teams own their product's quality; the platform team makes doing it well easy.
</div>

</div>

<div class="quiz-q" markdown>

**9. Which is the best measure of whether a QA platform is working?**

- [ ] The number of tools it offers
- [x] Adoption and developer outcomes: services on the paved road, time to first green pipeline, flaky rate, developer satisfaction
- [ ] The size of the platform team
- [ ] How many standards exist

<div class="quiz-why" markdown>
Treat the platform as a product: measure what it changes for its users.
</div>

</div>

<div class="quiz-q" markdown>

**10. A platform team wants a new standard enforced across 50 services. What's a sensible rollout?**

- [ ] Block every non-conforming service immediately
- [x] Ship it in the baseline, report it fleet-wide, migrate the riskiest services first, then block new violations
- [ ] Send an email and hope
- [ ] Let each team decide whether to care

<div class="quiz-why" markdown>
Report first, make adoption easy, then enforce for new code: visibility, then the road, then the rule.
</div>

</div>

</div>

## Wrap-up

### Mental model

> **A QA platform turns good practice into the default.**
>
> Standards say what "good" is; a conformance kit checks it everywhere; a paved road (a library, a template, a reusable pipeline) makes meeting it the easiest option; a fleet report shows where every service stands. The platform team builds the road, product teams own their quality, and the platform's own code is tested as carefully as anything that runs everywhere should be.

### 10 key things to remember

1. **Quality doesn't scale by headcount;** it scales by platforms and practices.
2. **Standards as code:** few, justified, automated, versioned.
3. **Fleet visibility first:** you can't improve what you can't see across services.
4. **Fix once, in one place:** cross-cutting behaviour belongs in a shared baseline.
5. **Libraries for behaviour, templates for structure.**
6. **New services start on the road:** scaffolding with tests and CI from the first commit.
7. **Reusable pipelines** spread improvements, and changes, to everyone.
8. **Platform code is high-risk code:** validate inputs, test it, review it.
9. **Run the platform as a product:** adoption, DevEx, support, versioning.
10. **Road before rules:** make it easy, then measure, then enforce.

### Common mistakes

- Mandating standards without a paved road.
- Copy-paste templates that drift from day two.
- Untested platform libraries and scaffolders.
- No fleet view, so standards are audited by spreadsheet.
- Breaking changes to shared workflows without notice.
- Too many standards, or standards nobody can explain.
- A platform team that becomes a ticket queue.
- Leaving framework defaults (like HTML error pages) in production.

### Hands-on challenge

**Grow the platform.**

1. **A sixth standard.** Add a `ready` standard to the conformance kit: services must expose `GET /ready` (Topic 10). Implement it in the baseline with an optional list of dependency checks, and see which services pass.
2. **Move the shop onto the road.** Adopt the baseline in `app/src/server.js` with the shop's own CSP. Which of its existing middleware can you delete? Does every test still pass?
3. **Scorecards.** Extend `fleet.mjs` to print a score per service (standards met ÷ total) and to write `test-results/fleet.json`, then add it to the quality report from Topic 11.
4. **Stretch:** version the baseline. Give it a `version` export, make the conformance kit check that services use at least a minimum version, and write the changelog entry you'd send to fifty teams.

Share your sixth standard in the discussions. Which standards would you add next, and which would you never mandate?

### What to learn next

**Topic 14 — Quality Strategy and Engineering Leadership.** The last topic steps back: how to set a quality strategy for a product or an organisation, decide where to invest, make quality visible to leadership, and lead the people and culture behind it, using everything from the previous thirteen topics as evidence.

Read before Topic 14 (optional):

- Matthew Skelton and Manuel Pais, *Team Topologies*
- Spotify Engineering, [*How We Use Golden Paths to Solve Fragmentation in Our Software Ecosystem*](https://engineering.atspotify.com/2020/08/how-we-use-golden-paths-to-solve-fragmentation-in-our-software-ecosystem/)
- Neal Ford, Rebecca Parsons and Patrick Kua, *Building Evolutionary Architectures* (fitness functions)

When you've finished the lab and the challenge, move on to [Topic 14](../14-strategy/index.md).
