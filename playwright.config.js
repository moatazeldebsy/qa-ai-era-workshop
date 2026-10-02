import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT) || 3210;
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
  reporter: [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'e2e', testDir: 'labs/playwright/tests', use: { ...devices['Desktop Chrome'] } },
    { name: 'api', testDir: 'labs/api/tests' },
    { name: 'flaky', testDir: 'labs/flaky/tests', retries: 0, use: { ...devices['Desktop Chrome'] } },
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
