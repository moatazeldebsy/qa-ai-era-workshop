# Setup

Allow 15 minutes. Do this **before** the workshop. Downloading browsers over conference Wi-Fi is how a workshop loses its first hour.

## Prerequisites

| Tool | Version | Needed for | Check |
|---|---|---|---|
| Node.js | **22.22+** (24 recommended, see `.nvmrc`) | Demo app, Playwright, promptfoo | `node --version` |
| Git | any recent | Cloning | `git --version` |
| k6 | 0.50+ | Lab 5 | `k6 version` |
| Python | 3.9+ | Lab 8 | `python3 --version` |
| An AI assistant | Claude, GitHub Copilot or similar | Lab 3 (optional) | — |

??? tip "Installing k6"
    macOS: `brew install k6` · Windows: `winget install k6` · Linux and Docker: see [grafana.com/docs/k6/latest/set-up/install-k6](https://grafana.com/docs/k6/latest/set-up/install-k6/).

??? tip "Using nvm"
    `nvm install && nvm use` in the repo root picks up `.nvmrc`.

## Install

```bash
git clone https://github.com/moatazeldebsy/qa-ai-era-workshop.git
cd qa-ai-era-workshop
npm install
npx playwright install --with-deps chromium
```

## Check everything works

```bash
npm run test:unit     # 5 unit tests, under a second
npm test              # 33 E2E + API tests; starts the app for you
```

Both should be green. Then start the app and look around:

```bash
npm start
# Quality Books on http://localhost:3210 (assistant: mock, bug mode: off)
```

Open <http://localhost:3210>, add a book to the cart, and ask the assistant *"How much is Prompting for QA?"*.

!!! note "Port 3210"
    The app uses port 3210 so it doesn't clash with the many tools that sit on 3000. Change it with `PORT=4000 npm start`; Playwright, k6 and promptfoo all read `PORT` or `BASE_URL`.

## Optional: a real model

Every lab works without an API key. To point the assistant (Lab 6) or the test generator (Lab 3) at a real Claude model:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
ASSISTANT_MODE=claude npm start       # model: ASSISTANT_MODE / ASSISTANT_MODEL, default claude-opus-5-5
npm run testgen                       # writes a draft test to labs/ai-testgen/generated/
```

These calls cost real money, though only cents for the workshop exercises.

## Run the docs locally

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-docs.txt
mkdocs serve      # http://127.0.0.1:8000
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| Every Playwright test fails with `Unexpected end of JSON input` | Something else is on the port and Playwright reused it. Stop it, or run with `PORT=3300 npm test`. |
| `promptfoo requires a supported Node.js runtime` | Upgrade Node to 22.22+ (`nvm install 24`). |
| `browserType.launch: Executable doesn't exist` | `npx playwright install chromium` |
| k6 `connection refused` | The app isn't running. `npm start` in another terminal first. |
