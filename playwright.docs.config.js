import { defineConfig, devices } from '@playwright/test';

// Smoke tests for the course site's self-learner features (quizzes, progress).
// Build the site first: `mkdocs build`, then `npm run test:docs`.
const PORT = Number(process.env.DOCS_PORT) || 8765;

export default defineConfig({
  testDir: 'tests/docs',
  timeout: 30_000,
  reporter: [['list']],
  outputDir: 'test-results/docs',
  use: { baseURL: `http://127.0.0.1:${PORT}`, ...devices['Desktop Chrome'] },
  webServer: {
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1 --directory site`,
    url: `http://127.0.0.1:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
    stderr: 'ignore', // http.server logs every request to stderr
  },
});
