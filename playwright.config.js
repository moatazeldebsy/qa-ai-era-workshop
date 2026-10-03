import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT) || 3210;

// The quality gate (Lab 7) reads test-results/junit.xml as the evidence for the
// main suite (`npm test` = e2e + api). Any other selection - the flaky lab, the
// agent-tool tests, a single project - writes its own junit-<projects>.xml, so
// running it never replaces the gate's evidence with the wrong tests.
const projects = process.argv.filter((a) => a.startsWith('--project=')).map((a) => a.slice('--project='.length)).sort();
const isMainSuite = projects.join(',') === 'api,e2e';
const junitFile = isMainSuite ? 'test-results/junit.xml' : `test-results/junit-${projects.join('-') || 'all'}.xml`;
const baseURL = process.env.BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  // Retries hide flakiness locally; in CI one retry plus the HTML report's
  // "flaky" label surfaces it instead (Lab 4).
  retries: process.env.CI ? 1 : 0,
  // Playwright empties outputDir at the start of every run, so it gets its own
  // subfolder; the k6 and promptfoo results beside it in test-results/ survive
  // for the quality gate (Lab 7).
  outputDir: 'test-results/playwright',
  reporter: [['list'], ['html', { open: 'never' }], ['junit', { outputFile: junitFile }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'e2e', testDir: 'labs/playwright/tests', use: { ...devices['Desktop Chrome'] } },
    { name: 'api', testDir: 'labs/api/tests' },
    { name: 'flaky', testDir: 'labs/flaky/tests', retries: 0, use: { ...devices['Desktop Chrome'] } },
    { name: 'agent-tools', testDir: 'labs/ai-agent/tests', use: { ...devices['Desktop Chrome'] } },
  ],
  // Starts the demo app unless BASE_URL points somewhere else.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'node app/src/server.js',
        url: `${baseURL}/health`,
        reuseExistingServer: !process.env.CI,
        env: { PORT: String(PORT), LOG_REQUESTS: 'false' },
      },
});
