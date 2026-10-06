#!/usr/bin/env node
// npm run docs:diagrams - render the course site's diagrams to SVG images.
//
// Each diagram's source is a Mermaid file in docs/diagrams/<name>.mmd. This
// renders it twice, in the site's light and dark palettes, to
// docs/assets/diagrams/<name>.svg and <name>-dark.svg; pages show the one
// that matches the reader's theme (Material's #only-light / #only-dark).
//
//   npm run docs:diagrams              render every diagram
//   npm run docs:diagrams -- roadmap   only those whose name contains "roadmap"
//
// The images are committed, so building the site needs no browser. Rendering
// uses Playwright's Chromium, which the course already installs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'docs/diagrams');
const outDir = path.join(root, 'docs/assets/diagrams');

// The site's palette (docs/stylesheets/extra.css). Arial/Helvetica: an <img>
// can't load web fonts, and these two have the same metrics everywhere.
const font = 'Helvetica, Arial, sans-serif';
const themes = {
  light: {
    darkMode: false, background: '#ffffff', fontFamily: font, fontSize: '15px',
    primaryColor: '#eef1fd', primaryBorderColor: '#1f3bd6', primaryTextColor: '#111827',
    secondaryColor: '#f6f7f9', tertiaryColor: '#f6f7f9', lineColor: '#4b5563', textColor: '#1f2937',
    clusterBkg: '#f6f7f9', clusterBorder: '#d1d5db', edgeLabelBackground: '#ffffff',
    actorBkg: '#eef1fd', actorBorder: '#1f3bd6', actorTextColor: '#111827', signalColor: '#4b5563', signalTextColor: '#1f2937',
    labelBoxBkgColor: '#eef1fd', labelBoxBorderColor: '#1f3bd6', loopTextColor: '#1f2937',
    noteBkgColor: '#fff8e1', noteBorderColor: '#d4a72c', noteTextColor: '#1f2937',
  },
  dark: {
    darkMode: true, background: '#1b1b1d', fontFamily: font, fontSize: '15px',
    primaryColor: '#262b45', primaryBorderColor: '#7c93ff', primaryTextColor: '#f3f4f6',
    secondaryColor: '#242526', tertiaryColor: '#242526', lineColor: '#9ca3af', textColor: '#e3e3e3',
    clusterBkg: '#242526', clusterBorder: '#3f4247', edgeLabelBackground: '#1b1b1d',
    actorBkg: '#262b45', actorBorder: '#7c93ff', actorTextColor: '#f3f4f6', signalColor: '#9ca3af', signalTextColor: '#e3e3e3',
    labelBoxBkgColor: '#262b45', labelBoxBorderColor: '#7c93ff', loopTextColor: '#e3e3e3',
    noteBkgColor: '#3a3320', noteBorderColor: '#a8892a', noteTextColor: '#f3f4f6',
  },
};

const filter = process.argv[2] ?? '';
const names = fs
  .readdirSync(srcDir)
  .filter((f) => f.endsWith('.mmd') && f.includes(filter))
  .map((f) => f.slice(0, -4))
  .sort();
if (!names.length) {
  console.error(`No diagrams in docs/diagrams/ match "${filter}".`);
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html><body></body></html>');
  await page.addScriptTag({ path: path.join(root, 'node_modules/mermaid/dist/mermaid.min.js') });
  for (const [theme, themeVariables] of Object.entries(themes)) {
    for (const name of names) {
      const code = fs.readFileSync(path.join(srcDir, `${name}.mmd`), 'utf8');
      const svg = await page.evaluate(
        async ({ code, themeVariables, id }) => {
          // SVG text, not HTML labels: an <img> renders no foreignObject HTML reliably.
          window.mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'strict',
            theme: 'base',
            themeVariables,
            htmlLabels: false,
            markdownAutoWrap: false,
            flowchart: { htmlLabels: false, wrappingWidth: 1000 },
            // Flat boxes like the rest of the site, and edge labels on a solid
            // background so the line behind them doesn't strike through the text.
            themeCSS: `* { filter: none !important; } .edgeLabel rect.background, .edgeLabel rect { fill: ${themeVariables.edgeLabelBackground} !important; opacity: 1 !important; }`,
          });
          return (await window.mermaid.render(id, code)).svg;
        },
        { code, themeVariables, id: `d-${name}` },
      );
      // Give the image its natural size, so pages don't stretch small diagrams.
      const [, , w, h] = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
      const sized = svg
        .replace(/ style="max-width:[^"]*"/, '')
        .replace(/ width="100%"/, '')
        .replace('<svg ', `<svg width="${Math.ceil(w)}" height="${Math.ceil(h)}" `);
      fs.writeFileSync(path.join(outDir, `${name}${theme === 'dark' ? '-dark' : ''}.svg`), `${sized}\n`);
    }
  }
} finally {
  await browser.close();
}
console.log(`Rendered ${names.length} diagram(s), light and dark, to docs/assets/diagrams/`);
