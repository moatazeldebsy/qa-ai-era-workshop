# Lab 3 — AI-assisted test generation

**Time:** 45 min · **Tracks:** QA, Dev (Managers: observe a pair) · **Module:** [2. AI-Powered Testing](../modules/02-ai-powered-testing.md)

## Goal

Use an AI model to draft API tests from a spec, then **review them like a senior engineer**: keep the good ones, fix the wrong ones, delete the useless ones, and measure the ratio.

## Files

- `labs/ai-testgen/prompts/generate-api-tests.md`: the generation prompt
- `labs/ai-testgen/prompts/risk-based-test-ideas.md`: the planning prompt (Module 2 exercise)
- `labs/ai-testgen/review-checklist.md`: what to check
- `labs/ai-testgen/generate.mjs`: calls Claude if a key is set, otherwise prints the prompt

## Steps

**1. Generate.** Choose one:

=== "With your AI assistant (no key)"
    ```bash
    npm run testgen -- --print > prompt.txt
    ```
    Paste `prompt.txt` into Claude, Copilot Chat or your assistant. Save the code block it returns as `labs/ai-testgen/generated/api.generated.spec.js`.

=== "With an API key (optional)"
    ```bash
    export ANTHROPIC_API_KEY=sk-ant-...
    npm run testgen
    ```
    The script writes `labs/ai-testgen/generated/api.generated.<timestamp>.spec.js` and prints the token usage.

**2. Read the prompt** before the output. It asks the model to mark guessed values with `// VERIFY:` and bans sleeps and inter-test dependencies. Good prompts state constraints like these explicitly.

**3. Review with the checklist.** Open `review-checklist.md` and go through the generated file test by test. For each test, mark one of:

| Verdict | Meaning |
|---|---|
| **Keep** | Correct, useful, not a duplicate |
| **Fix** | Right idea, wrong detail (an invented value, a wrong status code) |
| **Delete** | Can't fail, duplicates Lab 2, or tests something the spec doesn't say |

**4. Run what you kept.** Move the reviewed file into `labs/api/tests/` and:

```bash
npm run test:api
```

**5. Prove the tests can fail.** Start the app with the planted pricing bug and point the tests at it:

```bash
PORT=3300 BUG_MODE=cart npm start            # terminal 1
BASE_URL=http://localhost:3300 npm run test:api   # terminal 2
```

Did the AI's tests catch the regression? Lab 2's tests catch it in three places. If the generated ones don't, what did they miss?

**6. Record the ratio.** Write it down: *generated N, kept K, fixed F, deleted D*. Compare across pairs.

## Stretch goals

- Run the **risk-based planning** prompt for the discount-code feature (Module 2 exercise), then generate tests for the top three risks.
- Ask the model to *review* Lab 2's `cart.api.spec.js` and suggest missing cases. Is it better at writing or at reviewing?
- Try the same prompt with two different models or assistants and compare the keep ratio.

## Debrief

1. What was your keep/fix/delete ratio? What were the most common faults?
2. Which generated test looked most convincing but was wrong?
3. How would you make this part of your team's workflow without lowering the bar?
