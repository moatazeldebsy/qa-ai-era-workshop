import { defineConfig, devices } from '@playwright/test';
import base from '../../playwright.config.js';
import { allPairs } from '../02-test-design/pairwise.mjs';

// Learning Path, Topic 5, lab step 5 — Topic 2's pairwise matrix, for real.
//
// Every pair of (browser, viewport, locale) values appears in at least one
// Playwright project: 10 projects instead of 27 (the minimum possible is 9).
// Each runs the E2E suite.
//
//   npm run ui:matrix                              all 10 (needs firefox + webkit)
//   MATRIX_BROWSERS=chromium npm run ui:matrix     only the chromium rows
const FACTORS = {
  browser: ['chromium', 'firefox', 'webkit'],
  viewport: ['mobile', 'tablet', 'desktop'],
  locale: ['en-GB', 'de-DE', 'ar-EG'],
};
const VIEWPORTS = {
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  tablet: { viewport: { width: 820, height: 1180 }, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 } },
};
const only = process.env.MATRIX_BROWSERS?.split(',');

const projects = allPairs(FACTORS)
  .filter((row) => !only || only.includes(row.browser))
  .map((row) => ({
    name: `${row.browser}-${row.viewport}-${row.locale}`,
    testDir: 'e2e/tests',
    use: {
      ...devices[{ chromium: 'Desktop Chrome', firefox: 'Desktop Firefox', webkit: 'Desktop Safari' }[row.browser]],
      ...VIEWPORTS[row.viewport],
      // isMobile is a Chromium-only emulation; firefox can't do it.
      ...(row.browser === 'firefox' ? { isMobile: false } : {}),
      locale: row.locale,
    },
  }));

export default defineConfig({
  ...base,
  testDir: '.',
  reporter: [['list'], ['html', { open: 'never', outputFolder: '../../playwright-report/matrix' }]],
  outputDir: '../../test-results/matrix',
  projects,
  webServer: base.webServer && { ...base.webServer, command: 'node app/src/server.js', cwd: '../..' },
});
