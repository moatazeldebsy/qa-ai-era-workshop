# QA Engineering Deep Dive

**Back to basics, all the way to leadership.**

A free, self-paced course on how software quality engineering really works: what each practice is for, how it works inside, where it breaks, and what it costs. It's built for QA engineers, SDETs, developers and engineering leads who want to understand the field, not just pass an interview.

Fourteen topics take you from *"what is quality?"* to running quality across an engineering organisation. Every topic is taught on one small, real system, and every topic ends in a hands-on lab you can check with a single command.

<div class="grid cards" markdown>

-   :material-flag-checkered: **Start here**

    ---

    How the course works, what to install (or open it in Codespaces), and which route fits your role.

    [→ How this course works](start/how-it-works.md)

-   :material-map-outline: **The 14 topics**

    ---

    Foundations, test design, unit to E2E, CI/CD, data, performance, security, observability, quality intelligence, AI, platforms and leadership.

    [→ Topics](topics/index.md)

-   :material-flask-outline: **Labs you can check**

    ---

    Each lab finds real problems in the demo app. `npm run learn:check <topic>` tells you which steps are done and what's missing.

    [→ Setup](start/setup.md)

-   :material-account-group-outline: **Learn together**

    ---

    Ask questions, compare notebooks and share challenge solutions in the course discussions.

    [→ Community](start/community.md)

</div>

## What makes it different

- **Deep, but simple.** Every new term is explained before it's used. Every topic covers the same thirteen angles: what it is, why it exists, how it works inside, how it scales, what it costs, how it fails, and how it compares.
- **One system, many lenses.** *Quality Books*, a tiny bookshop with a cart, orders and an AI support assistant, grows with the course. You test the same code with partitions, properties, contracts, browsers, load, attacks and telemetry.
- **Real findings, not toy exercises.** The labs find genuine bugs and inconsistencies in this repo, and you fix them.
- **Check your own work.** Automatic lab checks, quizzes with explanations, hints, and reference solutions you can diff against.
- **Free and open.** MIT-licensed. It runs on a laptop or in GitHub Codespaces, and needs no API key.

## The demo app in one paragraph

**Quality Books** is a small bookshop. It has a catalogue, a cart with a free-shipping rule, an order lifecycle with a returns policy, a deliberately slow recommendations widget, and an **AI support assistant**. The assistant runs deterministically by default, with a `buggy` mode for testing AI failures and an optional real-model mode. See [Demo App](reference/demo-app.md).

[Start the course :material-arrow-right:](start/how-it-works.md){ .md-button .md-button--primary }
[See the topics](topics/index.md){ .md-button }
