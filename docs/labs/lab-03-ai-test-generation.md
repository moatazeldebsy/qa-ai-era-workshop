# Lab 3 — AI-assisted test generation

Use an AI model to draft API tests from the OpenAPI spec, then review them the way a senior engineer would: keep the good ones, fix the wrong ones, delete the useless ones, and measure the ratio.

By the end you'll have:

- a **generated test file** for the shop's API, from Claude, Copilot or your assistant
- **reviewed every test** against a checklist, as keep, fix or delete
- **proved** whether the generated tests catch a planted pricing bug
- your **keep/fix/delete ratio**, the honest measure of how much the AI helped

**Time:** 45 min · **Tracks:** QA, Dev (managers: observe a pair) · **Module:** [2. AI-Powered Testing](../modules/02-ai-powered-testing.md)

## Prerequisites

- The [Quickstart](../start/setup.md) is done.
- An AI assistant (Claude, GitHub Copilot Chat or similar), **or** an `ANTHROPIC_API_KEY`.

| File | What's in it |
|---|---|
| `labs/ai-testgen/prompts/generate-api-tests.md` | The generation prompt |
| `labs/ai-testgen/review-checklist.md` | What to check in every generated test |
| `labs/ai-testgen/generate.mjs` | Calls Claude when a key is set; otherwise prints the prompt |
| `app/openapi.yaml` | The input |

!!! warning "Never paste real customer data or secrets into a model"
    This lab only sends the public OpenAPI spec of a demo app. In your own work, check what you are sending, and where, before you send it.

## 1. Generate the tests

=== "With your AI assistant (no key)"

    ```bash
    npm run testgen -- --print > prompt.txt
    ```

    Paste `prompt.txt` into your assistant. Save the code block it returns as
    `labs/ai-testgen/generated/api.generated.spec.js`.

=== "With an API key (optional)"

    ```bash
    export ANTHROPIC_API_KEY=sk-ant-...
    npm run testgen
    ```

    ```text title="Expected output"
    Generating tests with claude-opus-5-5...
    Wrote labs/ai-testgen/generated/api.generated.2026-10-03T09-12-44-512Z.spec.js
    Tokens: 2210 in / 3874 out
    Next: review it, move it into labs/04-integration-contract/api/tests/, then run  npm run test:api
    ```

    The model is `claude-opus-5-5` at medium effort (`TESTGEN_MODEL` to change it). One run costs a few cents.

## 2. Read the prompt first

```markdown title="labs/ai-testgen/prompts/generate-api-tests.md (excerpt)"
- Only assert behaviour the spec states. If you have to guess an exact value
  (a price, a message), put it in a clearly named constant with a `// VERIFY:`
  comment instead of asserting silently.
- No sleeps, no retries, no test depending on another test's state.
```

A good prompt states its constraints explicitly. The `// VERIFY:` convention makes the model flag its own guesses, though it won't flag all of them.

## 3. Review every test

Open `labs/ai-testgen/review-checklist.md` and go through the generated file one test at a time:

| Verdict | Meaning |
|---|---|
| **Keep** | Correct, useful, and not a duplicate of Lab 2 |
| **Fix** | Right idea, wrong detail: an invented value or a wrong status code |
| **Delete** | Can't fail, duplicates an existing test, or tests something the spec doesn't say |

!!! tip "The oracle question"
    For every `expect`, ask: *which line of the spec says this value is right?* If the answer is "none, the model made it up", that's a **fix** or a **delete**.

## 4. Run what you kept

```bash
mv labs/ai-testgen/generated/api.generated*.spec.js labs/04-integration-contract/api/tests/
npm run test:api
```

## 5. Prove the tests can fail

Point them at the app with the planted pricing bug:

```bash
PORT=3300 BUG_MODE=cart npm start                    # terminal 1
BASE_URL=http://localhost:3300 npm run test:api      # terminal 2
```

```text title="Expected output (Lab 2's tests alone)"
  3 failed
    [api] › cart.api.spec.js › pricing rules › exactly over the threshold ships free
    [api] › cart.api.spec.js › pricing rules › mixed basket over threshold ships free
    [api] › cart.api.spec.js › pricing rules › two different books over threshold ship free
```

Did any **generated** test fail too? If not, the generated suite never checked the free-shipping rule with a cart over 50 EUR. That's the gap a reviewer has to spot.

## 6. Record the ratio

Write it on the board: *generated N, kept K, fixed F, deleted D*, and the single most convincing test that turned out wrong. Compare across pairs.

## The whole lab, end to end

```bash
npm run testgen -- --print > prompt.txt         # 1. or: npm run testgen (with a key)
# 2-3. read the prompt, review with review-checklist.md
mv labs/ai-testgen/generated/*.spec.js labs/04-integration-contract/api/tests/ && npm run test:api   # 4.
PORT=3300 BUG_MODE=cart npm start &              # 5.
BASE_URL=http://localhost:3300 npm run test:api
```

## Stretch goals

- Run the **risk-based planning** prompt (`prompts/risk-based-test-ideas.md`) for a discount-code feature, then generate tests for its top three risks.
- Ask the model to **review** Lab 2's `cart.api.spec.js` instead of writing tests. Is it better at writing or at reviewing?
- Run the same prompt through two assistants and compare their keep ratios.

## Debrief

1. What was your keep/fix/delete ratio? What were the most common faults?
2. Which generated test looked most convincing but was wrong?
3. How would you make this part of your team's workflow without lowering the bar?

## Next steps

<div class="grid cards" markdown>

-   **Lab 6 — Evaluating an LLM feature**

    ---

    From using AI to test, to testing AI: an eval suite for the shop's assistant.

    [→ Lab 6](lab-06-llm-evaluation.md)

-   **Module 2 — AI-Powered Testing**

    ---

    Self-healing tests, defect analysis, predictive quality, and where each fails.

    [→ Module 2](../modules/02-ai-powered-testing.md)

</div>
