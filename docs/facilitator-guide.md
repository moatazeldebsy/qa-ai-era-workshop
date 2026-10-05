# Facilitator guide

Notes for whoever runs the workshop.

## Before the day

- [ ] Send the [Quickstart](start/setup.md) page a week ahead and ask everyone to post the output of `npm run doctor` and `npm test` in the event channel. Chase anyone who doesn't.
- [ ] Point locked-down laptops at **GitHub Codespaces**: the repo's dev container installs everything (*Code → Codespaces → Create codespace*). Try it yourself once; the first build takes about 5 minutes.
- [ ] Decide how you'll run [Lab 9](labs/lab-09-ai-agent.md): a facilitator demo with **one** API key on your machine (don't hand keys out), or attendees on route B with their own Claude Code or Copilot.
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
| 9 | Agents need an oracle | Run the same charter with `--no-oracle` side by side and compare the findings |
| 1 | Automated a11y checks are incomplete | Delete the search label: axe still passes, the label-based tests fail |

## Common problems

| Problem | Fix |
|---|---|
| Anything at all | Start with `npm run doctor`: it names the problem and the fix |
| Port clash | `PORT=3300 npm test` / `PORT=3300 npm start` |
| Corporate proxy blocks browser download | `PLAYWRIGHT_DOWNLOAD_HOST` to an internal mirror, or use Codespaces |
| Old Node | `nvm install 24` |
| promptfoo asks to log in or share | Ignore it; results stay local. `PROMPTFOO_DISABLE_TELEMETRY=1` silences telemetry. |

## After the workshop

Ask each team to leave with **one** concrete change, for example: "add the eval suite for our chatbot to CI", or "agree our release gate thresholds". Follow up in two weeks.
