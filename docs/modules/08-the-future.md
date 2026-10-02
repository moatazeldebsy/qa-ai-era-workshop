# 8. The Future

*More intelligent, more autonomous, more human*

## Why it matters

Some of what follows is already in production at a few companies; some is a few years out. Thinking about it now helps you decide what to learn and what to build.

## Key ideas

### AI agents for end-to-end testing

Agents that are given a goal ("check a customer can buy a book and get free shipping over 50 EUR") and explore the app themselves, through the browser or the API, instead of following a script. They are good at exploration and at keeping up with UI changes. They are weak at *knowing what correct means* without a precise oracle, and they are non-deterministic. Expect them to complement scripted suites, not replace them, and to need the same review discipline as generated tests (Module 2).

### Autonomous quality systems

Pipelines that do more on their own:

- pick which tests to run for a change (test-impact analysis);
- quarantine flaky tests automatically and open a ticket;
- roll back a canary when quality signals degrade;
- propose fixes for failures as pull requests.

The design question is always: **what may the system do alone, and what needs a human approval?** Write it down.

### Synthetic users and real user monitoring

Synthetic users (scripted or AI-driven) give a constant baseline signal; real-user monitoring shows actual experience across devices and networks. Comparing the two finds problems that neither finds alone.

### Quality as a service (platforms and self-service)

Platform teams package quality as golden paths: a new service gets a pipeline with tests, a quality gate, synthetic monitors and dashboards on day one. The QA expertise is encoded in the platform, so every team benefits without a QA engineer in every team.

### Human + AI collaboration

The durable split: **AI for breadth and speed, humans for judgment and accountability**. Humans decide what quality means for this product and these customers, choose the risks to accept, and own the outcome. That is the "more human" in the subtitle: the work that remains is the most human part.

### Focus on trust, ethics and responsible AI

As products include more AI, QA becomes part of how an organisation earns trust: testing for fairness, transparency and safety, documenting what was tested, and having the standing to say "not ready" when it isn't.

## Discuss

1. Which of these is closest to your team's reality? Which feels furthest away?
2. What would you let an autonomous quality system do without asking? What never?
3. What does "responsible AI" mean in *your* product, concretely?

## Exercise (15 min): your two-year plan

In groups, write three bets on a page:

- **Start:** one thing to adopt in the next six months.
- **Stop:** one practice that won't survive the AI era.
- **Protect:** one human responsibility you will never automate.

Share and compare.

## Takeaways by role

=== "QA & SDET"
    Build the skills that agents need from you: precise oracles, good test data, and clear acceptance criteria.

=== "Developers"
    Design for testability by agents too: accessible UIs, stable APIs, good logs.

=== "Managers & leads"
    Decide and document the autonomy boundaries for AI in your delivery process before a tool decides them for you.
