# Facilitator guide

Notes for whoever runs the workshop.

## Before the day

- [ ] Send the [Quickstart](getting-started.md) page a week ahead and ask everyone to post the output of `npm test` in the event channel. Chase anyone who doesn't.
- [ ] Have a fallback: a cloud dev environment (Codespaces works; the repo has no special requirements) for people whose laptops are locked down.
- [ ] Decide whether you'll show the real-model mode. If so, use **one** facilitator API key on your machine. Don't hand keys out.
- [ ] Print or share the [Cheat Sheet](reference/cheat-sheet.md).
- [ ] Run every lab yourself on the venue network the day before.

## Running the labs

- **Pair up.** Mixed roles per pair (see [Agendas](agendas.md#tracks-for-a-mixed-room)).
- **Time-box hard.** Every lab has a core part and *stretch goals*. Call time when most pairs have finished the core.
- **Debrief every lab** with the three questions at its end. The debrief is where the learning happens, so don't skip it to save time.

## The "aha" moments to make sure land

| Lab | Moment | How to provoke it |
|---|---|---|
| 1 | Role-based locators survive UI change | Rename a CSS class in `index.html` live; the tests still pass |
| 3 | AI-generated tests can be confidently wrong | Ask the room: "Which of these asserts would still pass if the price were wrong?" |
| 4 | Retries hide flakiness, they don't fix it | Show `retries: 2` making the bad test "green" |
| 6 | An LLM feature needs a regression suite | Switch the app to `buggy` mode and re-run the same eval |
| 7 | The gate is a team agreement, not a tool | Ask managers to change a threshold and defend it |
| 8 | Metrics hide things | Ask: "Our MTTD is 35 min. Is that good?" Then show the per-source breakdown |

## Common problems

| Problem | Fix |
|---|---|
| Port clash | `PORT=3300 npm test` / `PORT=3300 npm start` |
| Corporate proxy blocks browser download | `PLAYWRIGHT_DOWNLOAD_HOST` to an internal mirror, or use Codespaces |
| Old Node | `nvm install 24` |
| promptfoo asks to log in or share | Ignore it; results stay local. `PROMPTFOO_DISABLE_TELEMETRY=1` silences telemetry. |

## After the workshop

Ask each team to leave with **one** concrete change, for example: "add the eval suite for our chatbot to CI", or "agree our release gate thresholds". Follow up in two weeks.
