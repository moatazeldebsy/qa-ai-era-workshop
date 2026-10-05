# For facilitators

The course is self-paced, but it started as a facilitated workshop and still works as one. This page is for anyone running it with a group: a team, a meetup or a conference workshop.

## Formats

| Format | Length | Topics | Shape |
|---|---|---|---|
| **Study group** | 1 h every 1–2 weeks | All 14, in order | Learners work alone, then meet to compare (see [Community](../start/community.md#run-a-study-group)) |
| **Half day** | 3.5 h | 1 + the AI labs of 12 | Concepts talk (40 min), Topic 1 lab, AI test generation and LLM evaluation labs, retro |
| **Full day** | 7 h | 1, 2, 5, 6 | Foundations and test design in the morning; E2E, flaky tests and a quality gate in the afternoon |
| **Two days** | 2 × 7 h | Day 1: 1–6 · Day 2: 8, 9, 11, 12 | Labs only; Concepts read beforehand |

For any facilitated format, ask people to finish [Setup](../start/setup.md) the week before and to post their `npm run learn:doctor` output. Codespaces is the fallback for locked-down laptops.

## Running the labs with a group

- **Pair up across roles.** A QA engineer with a developer finds more and explains more.
- **Time-box hard.** Call time when most pairs have finished the core steps; the challenges are for later.
- **Debrief every lab.** Ask: what did you find, what surprised you, and what would you change in your own team? The debrief is where the learning sticks.
- **Use `learn:check` as a progress board.** Ask pairs to call out when they reach each step.
- **Don't hand out API keys.** Every lab works without one. If you demo the real-model route, use one key on your own machine.

## Before the day

- [ ] Run every lab you plan to use, on the venue network, the day before.
- [ ] Check `npm run learn:status` on a fresh clone shows every topic at 0.
- [ ] Share the [cheat sheet](cheat-sheet.md).
