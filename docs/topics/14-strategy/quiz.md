# Topic 14 · Quiz & wrap-up

## Quiz

Ten questions about understanding, not recall. Pick an answer to see whether it's right and why. Your best score is saved on this device.

<div class="quiz" data-quiz="14" markdown>

<div class="quiz-q" markdown>

**1. What distinguishes a quality strategy from a test plan?**

- [ ] Length
- [x] A strategy sets goals, priorities, investments and ownership for months; a plan details what to test for one release
- [ ] Only managers write strategies
- [ ] There is no difference

<div class="quiz-why" markdown>
Strategy decides where effort goes and why; plans execute it for a specific scope.
</div>

</div>

<div class="quiz-q" markdown>

**2. The risk register says a performance risk is covered by a check of the HTTP status code. What's the problem?**

- [ ] Status checks are slow
- [x] The evidence can't detect the risk: a slow response still returns 200
- [ ] Performance risks don't need evidence
- [ ] Nothing: it's traced

<div class="quiz-why" markdown>
Traceability proves a link exists, not that the linked check can catch the risk. Check the fit of evidence, not only its presence.
</div>

</div>

<div class="quiz-q" markdown>

**3. The highest-scored risk is checked by LLM evals, but the release gate marks LLM evals as optional. What should a strategy do?**

- [ ] Lower the risk score
- [x] Align the gate with the risk ranking: require the evidence for the top risks
- [ ] Remove the evals
- [ ] Nothing: gates and risks are separate

<div class="quiz-why" markdown>
Release rules should follow from what matters most. Misalignment is invisible until risks and gates are read side by side.
</div>

</div>

<div class="quiz-q" markdown>

**4. Which cost-of-quality category is usually the most expensive?**

- [ ] Prevention
- [ ] Appraisal
- [ ] Internal failure
- [x] External failure: incidents, refunds, support, lost customers, fines

<div class="quiz-why" markdown>
Strategy moves spending towards prevention, because failures found by customers cost the most.
</div>

</div>

<div class="quiz-q" markdown>

**5. Which investment is likely to reduce the most risk per unit of effort across fifty services?**

- [ ] One more E2E test per service
- [x] A shared baseline and paved road that fixes a whole class of problems everywhere it's adopted
- [ ] A longer test plan template
- [ ] More manual regression

<div class="quiz-why" markdown>
Prefer investments that remove classes of problems over ones that catch instances.
</div>

</div>

<div class="quiz-q" markdown>

**6. A strategy statement says "quality is everyone's responsibility". What's wrong with it as written?**

- [ ] It's false
- [x] Nobody would behave differently because of it; strategies need specific decisions and measures
- [ ] It's too long
- [ ] It should say QA's responsibility

<div class="quiz-why" markdown>
Test each sentence: would a team act differently? Specific commitments with owners and dates do; slogans don't.
</div>

</div>

<div class="quiz-q" markdown>

**7. What did Google's Project Aristotle find most predictive of team effectiveness?**

- [ ] Team size
- [x] Psychological safety
- [ ] Seniority
- [ ] Test coverage

<div class="quiz-why" markdown>
When people feel safe to admit mistakes and raise doubts, problems like flaky tests and near-misses surface early.
</div>

</div>

<div class="quiz-q" markdown>

**8. How has the QA role evolved in teams that deploy often?**

- [ ] QA is no longer needed
- [x] From executing tests at the end to enabling quality: coaching, risk analysis, platforms, automation and exploratory testing
- [ ] QA now only writes manual test cases
- [ ] QA approves every commit

<div class="quiz-why" markdown>
The work moved left (requirements, design), right (production) and up (platforms, strategy).
</div>

</div>

<div class="quiz-q" markdown>

**9. What should a one-page quality update for leadership end with?**

- [ ] A list of all failing tests
- [x] A clear decision or ask: what you need, what it costs, and what it buys
- [ ] Every metric you collect
- [ ] A history of the project

<div class="quiz-why" markdown>
Leaders read to decide. Business-language risks, a few defined numbers, and an explicit ask.
</div>

</div>

<div class="quiz-q" markdown>

**10. How often should a quality strategy be revisited?**

- [ ] Never: it's written once
- [x] On a regular cadence (for example quarterly) and after significant incidents
- [ ] Only when the CEO asks
- [ ] Every day

<div class="quiz-why" markdown>
Strategies age as products, risks and teams change. Evidence from incidents and scorecards drives the review.
</div>

</div>

</div>

## Wrap-up

### Mental model

> **Strategy is a few decisions, made with evidence, owned by people, and revisited.**
>
> Decide what quality means for your users, which risks matter most, what evidence would show they're under control, and where to invest so whole classes of problems disappear. Check that the evidence actually fits the risks. Lead so that people raise problems early and own quality together. Then look again, because the product, the risks and the team will have changed.

### 10 key things to remember

1. **A strategy is short, specific and evidence-based**, or it isn't used.
2. **Goals are measurable;** slogans aren't goals.
3. **Rank risks explicitly,** and challenge the ranking with what you learn.
4. **Evidence must fit the risk:** traced is not the same as protected.
5. **Derive release rules from the risk ranking.**
6. **Invest in prevention and in removing classes of problems.**
7. **Say what you won't do;** three priorities beat thirty.
8. **The QA role enables quality:** coach, risk analyst, platform builder, explorer.
9. **Culture is strategy's engine:** psychological safety, blameless learning, whole-team ownership.
10. **Communicate in business terms, and end with a decision.**

### Common mistakes

- Writing a long strategy nobody reads, or one that never changes.
- Strategies built on opinions instead of evidence.
- Trusting "covered" without checking whether the evidence can detect the risk.
- Release gates that ignore the top risks.
- Too many priorities.
- Treating QA as a separate phase or team.
- Using metrics as individual targets.
- Reporting test counts to leaders instead of risks and outcomes.

### Hands-on challenge

**Apply it to your own team.**

1. Run a small version of this lab on a system you work on: list five risks, find the evidence for each, and check whether each piece of evidence could actually detect its risk. How many are "traced but not protected"?
2. Write a one-page quality strategy for it, using the template in `notebook/_templates/14/strategy.md`.
3. Present the leadership update to someone senior, even informally, and note which questions they asked. Those questions show what your next update should answer.
4. Share what you learned (anonymised) in the discussions.

### What to learn next

You've finished the course. Some directions from here, depending on what you enjoyed most:

- **Go deeper on a specialism:** performance engineering, security testing, accessibility auditing or AI evaluation each have their own communities and certifications.
- **Build in public:** extend Quality Books with a feature and test it end to end, from risks to production monitoring, then write about it.
- **Contribute:** improve this course. Fix a mistake, add a lab variant, translate a page (see [Community](../../start/community.md)).
- **Teach it:** run a study group with these topics; explaining is the fastest way to master them.

Recommended reading for the long run:

- Lisa Crispin and Janet Gregory, *Agile Testing* and *More Agile Testing*
- Nicole Forsgren, Jez Humble and Gene Kim, *Accelerate*
- Matthew Skelton and Manuel Pais, *Team Topologies*
- Elisabeth Hendrickson, *Explore It!*
- Cem Kaner, James Bach and Bret Pettichord, *Lessons Learned in Software Testing*

Thank you for working through all fourteen topics. Go and make something better.
