// The five browser tools the Lab 9 agent can use, separated from the agent so
// they can be tested without a model (labs/12-ai-in-qa/agent/tests/tools.spec.js).
//
// defineTool is the SDK's betaTool in explore.mjs, and an identity function in
// the tests - each tool is { name, description, inputSchema, run }.

// Errors are returned to the model as text, not thrown, so the agent can
// recover ("no such button") instead of the whole run crashing.
async function guarded(fn) {
  try {
    return await fn();
  } catch (err) {
    return `ERROR: ${err.message.split('\n')[0]}`;
  }
}

// Wait until the page has had no request in flight for `quietMs`.
//
// Not page.waitForLoadState('networkidle'): that resolves immediately once the
// page has EVER been idle, so after a click it doesn't wait for the fetch the
// click started. The agent then snapshots stale cart totals and "finds" a bug
// that isn't there. labs/12-ai-in-qa/agent/tests/tools.spec.js caught exactly that.
function trackNetwork(page) {
  let inFlight = 0;
  let lastChange = Date.now();
  const bump = (d) => () => {
    inFlight += d;
    lastChange = Date.now();
  };
  page.on('request', bump(1));
  page.on('requestfinished', bump(-1));
  page.on('requestfailed', bump(-1));
  return async function settle({ quietMs = 300, timeoutMs = 10000 } = {}) {
    const deadline = Date.now() + timeoutMs;
    await new Promise((r) => setTimeout(r, 50)); // let the action's requests start
    while (Date.now() < deadline) {
      if (inFlight <= 0 && Date.now() - lastChange >= quietMs) return;
      await new Promise((r) => setTimeout(r, 50));
    }
  };
}

export function createTools({ page, defineTool, log = () => {}, findings = [] }) {
  const settle = trackNetwork(page);
  return [
    defineTool({
      name: 'open_page',
      description: 'Navigate the browser to a path of the shop, e.g. "/". Returns the page title.',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Path such as "/"' } },
        required: ['path'],
        additionalProperties: false,
      },
      run: ({ path }) =>
        guarded(async () => {
          log(`open ${path}`);
          await page.goto(path);
          await settle();
          return `Opened ${path}: "${await page.title()}"`;
        }),
    }),
    defineTool({
      name: 'page_snapshot',
      description:
        'The current page as an accessibility tree (roles, names, text, values). Use it to see what is on screen before acting, and after acting to check the result.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      run: () =>
        guarded(async () => {
          log('snapshot');
          await settle();
          return await page.locator('body').ariaSnapshot();
        }),
    }),
    defineTool({
      name: 'click',
      description:
        'Click an element by its ARIA role and accessible name, exactly as shown in page_snapshot (e.g. role "button", name "Add Testing in Production to cart").',
      inputSchema: {
        type: 'object',
        properties: {
          role: { type: 'string', description: 'ARIA role, e.g. button, link, checkbox' },
          name: { type: 'string', description: 'Accessible name, exact' },
        },
        required: ['role', 'name'],
        additionalProperties: false,
      },
      run: ({ role, name }) =>
        guarded(async () => {
          log(`click ${role} "${name}"`);
          await page.getByRole(role, { name, exact: true }).click({ timeout: 5000 });
          await settle();
          return `Clicked ${role} "${name}".`;
        }),
    }),
    defineTool({
      name: 'fill',
      description: 'Type into a form field identified by its label, replacing what is there. Set submit to press Enter afterwards.',
      inputSchema: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'The field label, e.g. "Search books"' },
          text: { type: 'string' },
          submit: { type: 'boolean', description: 'Press Enter after typing' },
        },
        required: ['label', 'text'],
        additionalProperties: false,
      },
      run: ({ label, text, submit }) =>
        guarded(async () => {
          log(`fill "${label}" = ${JSON.stringify(text)}${submit ? ' ⏎' : ''}`);
          const field = page.getByLabel(label, { exact: true });
          await field.fill(text, { timeout: 5000 });
          if (submit) {
            await field.press('Enter');
            // The assistant answers asynchronously; wait until it has.
            await page.locator('#assistant-answer').filter({ hasNotText: /^(Thinking…)?$/ }).waitFor({ timeout: 30000 }).catch(() => {});
          }
          await settle();
          return `Filled "${label}".`;
        }),
    }),
    defineTool({
      name: 'report_finding',
      description:
        'Record a problem you found. Only report what you observed and can reproduce. Say which product rule it breaks, or "no rule - usability" if none.',
      inputSchema: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
          title: { type: 'string' },
          steps: { type: 'array', items: { type: 'string' } },
          expected: { type: 'string' },
          actual: { type: 'string' },
          rule: { type: 'string', description: 'The product rule broken, quoted, or "no rule - usability"' },
        },
        required: ['severity', 'title', 'steps', 'expected', 'actual', 'rule'],
        additionalProperties: false,
      },
      run: async (finding) => {
        findings.push(finding);
        log(`FINDING [${finding.severity}] ${finding.title}`);
        return 'Recorded.';
      },
    }),
  ];
}
