# Topic 5 · Concepts

## 1. What is it?

**UI testing** checks a product through its user interface. **End-to-end (E2E) testing** checks a complete user journey through the whole system, from the browser through the front end, the APIs and the services behind them, the way a real user would.

Three terms you'll meet constantly:

- **Browser automation:** a program drives a real browser: it opens pages, clicks, types, and reads what's on the screen. Playwright, Cypress, Selenium and WebdriverIO are browser-automation tools with test runners around them.
- **Locator:** a description of how to find an element on the page: *"the button named Add Testing in Production to cart"*. Good locators describe what a user sees, not how the page is built.
- **Journey:** a sequence of steps towards a user goal: *search, add two books, see free shipping*. Many bugs only show up in sequences, not single steps.

E2E tests sit at the top of the test pyramid (Topic 1). They're the only tests that see what the customer sees, and the slowest, most expensive and most fragile tests you'll write. This topic is about getting their value without paying too much of that price.

## 2. Why do we need it?

Everything below the UI can be correct while the product is still broken:

- **The wiring.** The front end calls the wrong endpoint, sends the wrong field, or ignores an error. The API tests pass; the customer is stuck.
- **Timing.** Real users click fast, networks reorder responses, and pages load in pieces. This topic's lab finds a race where two quick clicks leave the cart showing an old total. No API test can see it.
- **State across steps.** After one failed action, does the next one work? The lab's "stuck cart" bug is invisible to every single-step test.
- **The browser itself.** Layout, focus, keyboard behaviour and rendering differ between Chromium, Firefox and WebKit, and between phone and desktop screens.
- **Accessibility.** Whether a keyboard or screen-reader user can complete a purchase can only be checked in a real page (Topic 9 goes deeper).

What E2E tests are **not** for: checking every pricing rule or every invalid input. Those belong at lower levels, where they're a thousand times cheaper (Topics 2–4).

## 3. How does it work internally?

### How a Playwright test drives a browser

![How a Playwright test drives a browser: the test calls click() on a locator, Playwright sends a protocol message to the browser, which finds the element in the live DOM and waits until it is attached, visible, stable, enabled and receives events before dispatching real input events; an expect() on the answer re-reads the element's text until it matches or times out, then passes or fails with the last value seen.](../../assets/diagrams/05-playwright-browser.svg#only-light){ loading=lazy }
![How a Playwright test drives a browser: the test calls click() on a locator, Playwright sends a protocol message to the browser, which finds the element in the live DOM and waits until it is attached, visible, stable, enabled and receives events before dispatching real input events; an expect() on the answer re-reads the element's text until it matches or times out, then passes or fails with the last value seen.](../../assets/diagrams/05-playwright-browser-dark.svg#only-dark){ loading=lazy }

Four mechanisms make modern browser tests reliable when used properly:

1. **Locators are lazy.** `page.getByRole(...)` doesn't search anything when created. It's resolved *every time it's used*, against the current page. A locator never goes stale, which was a constant source of flakiness with older element-handle APIs.
2. **Auto-waiting (actionability).** Before clicking, Playwright waits until the element is attached, visible, stable, enabled and not covered by something else. You don't write waits for those things.
3. **Web-first assertions retry.** `await expect(locator).toHaveText('59.98')` re-reads the page until it matches or times out. A one-shot read (`const t = await locator.textContent(); expect(t)...`) checks once, at whatever moment the code reaches it. That's the root of most flaky UI tests.
4. **Isolation by browser context.** Each test gets a fresh **browser context**: its own cookies, storage and cache, like a new incognito window. That's cheap (milliseconds), so tests can't leak state into each other.

### What happens when you run the suite

The runner starts the app if configured (`webServer` in `playwright.config.js`), launches browsers, runs test files in parallel **workers**, and records evidence on failure: screenshots, videos, and a **trace** (a recording of every action, DOM snapshot, network request and console message, viewable in the Trace Viewer).

## 4. Main components and concepts

### 4.1 What to put in an E2E suite

Choose E2E tests by **risk to user journeys**, not by feature lists:

- the critical paths that make money or keep customers (search → cart → checkout)
- behaviour that only exists in the browser: rendering, focus, keyboard, timing, client-side state
- integration of the front end with the real back end: a few journeys, not every rule

Keep each test **independent** (it sets up what it needs), **short** (one journey), and **named for the user goal**.

### 4.2 Locators: from best to worst

| Priority | Locator | Example | Why |
|---|---|---|---|
| 1 | **Role + accessible name** | `getByRole('button', { name: 'Add Testing in Production to cart' })` | How users and screen readers find things; also tests accessibility |
| 2 | **Label / placeholder / text** | `getByLabel('Search books')` | User-visible; survives restyling |
| 3 | **Test id** | `getByTestId('subtotal')` | Stable and explicit when there's no good user-facing handle |
| 4 | CSS by id/class | `#book-list .title` | Coupled to implementation |
| 5 | Position / structure / XPath | `li:nth-child(5) > button` | Breaks when anything moves |

A good rule: if the locator wouldn't make sense to a user reading it aloud, it's probably coupled to how the page is built.

### 4.3 Waiting: the most important habit

| Instead of | Use | Why |
|---|---|---|
| `page.waitForTimeout(1000)` | A web-first assertion on the condition you need | A fixed sleep is too short on a slow day and wastes time on a fast one |
| `expect(await locator.count()).toBe(2)` | `await expect(locator).toHaveCount(2)` | The first reads once; the second retries |
| Waiting for "network idle" | Waiting for the UI state that proves the work finished | Apps poll, stream and prefetch; idle may never come, or come too early |
| Guessing when async UI work finished | Expose it: `aria-busy`, a loading indicator, a status message | Better for screen-reader users *and* for tests (Topic 1: testability) |

### 4.4 Page objects and other abstractions

A **page object** wraps a page's locators and actions behind intention-revealing methods (`shop.addToCart('Prompting for QA', 2)`). Tests read like journeys, and when the page changes you fix one file. Keep page objects thin: locators and actions, **no assertions about business rules** (those belong in tests) and no clever logic.

Alternatives: **component objects** (one per reusable widget), the **Screenplay** pattern (actors with abilities performing tasks; scales to large suites), and Playwright **fixtures** that hand each test a ready page object or a logged-in user.

### 4.5 Controlling the network

The browser's network is a test input you can control:

- **Stub** a dependency: `page.route('**/api/recommendations', r => r.fulfill({ json: … }))` makes a slow or unreliable service instant and deterministic.
- **Delay or reorder** responses to reproduce timing bugs on purpose (the lab's race).
- **Fail** a request (`route.abort()`, or a 503) to test error states.
- **Observe** requests and responses with `page.waitForResponse` to assert on what the front end sent.

The trade-off from Topic 4 applies: every stub is an assumption about the real API. Stub at the edges you don't own, or for timing; use the real back end for the journeys that matter.

### 4.6 Flaky tests

A **flaky test** passes and fails on the same code. Google reported in 2016 that about 1.5% of all its test runs were flaky, and almost 16% of its tests had shown some flakiness. The common causes:

| Cause | Example | Fix |
|---|---|---|
| **Timing** | Sleeping 700 ms for a 200–1500 ms response | Web-first assertions; expose state; control the network |
| **Ordering / shared state** | Test B relies on data test A created | Each test creates its own data; fresh browser context |
| **Test data collisions** | Two parallel tests buy the last copy of a book | Unique data per test; reset or isolate state |
| **Environment** | Fonts, time zones, screen size, CPU load in CI | Pin them in config; run the same container locally and in CI |
| **Animations** | Clicking an element that's still moving | Actionability checks; disable animations in tests |
| **Third parties** | Analytics, maps, payment widgets | Stub them at the network |
| **The product itself** | A real race condition in the app | Not a test problem: a bug the test found (the lab's race test began as "flaky") |

**Retries hide flakiness; they don't fix it.** Use at most one retry in CI, report tests that needed it as *flaky* (Playwright's report does), and fix or quarantine them within days. A suite people don't trust gets ignored, including when it's right.

### 4.7 Test data and state for E2E

Setting up state through the UI is slow and fragile. Prefer:

- **API setup:** create the user, the cart or the order through the API, then test the one journey that matters through the UI.
- **Storage state:** log in once, save cookies and storage to a file, and start every test already authenticated.
- **Isolation:** unique data per test, so parallel workers don't fight over the same book.

Topic 7 covers test data management in depth.

### 4.8 Cross-browser, device and locale coverage

Browsers differ in rendering, focus behaviour, date and number formatting, and supported features. Phones differ in viewport, touch and performance. Locales differ in text length, number formats and writing direction (`ar-EG` is right-to-left).

You can't run every test everywhere. Topic 2's **pairwise** technique picks configurations so every pair of (browser, viewport, locale) values is covered: 10 Playwright projects instead of 27 in this lab. Real-device clouds (BrowserStack, Sauce Labs, LambdaTest) and Appium (for native mobile apps) extend the same idea to hardware you don't own.

### 4.9 Visual testing

**Visual regression testing** compares screenshots with approved baselines: `await expect(page).toHaveScreenshot()`. It catches layout and styling bugs no functional assertion sees. The catches: rendering differs across operating systems and fonts (generate baselines in the same container that runs CI), dynamic content must be masked, and approving changed baselines needs real review. Tools like Percy, Chromatic and Applitools add cross-browser rendering and smarter (AI-assisted) comparison.

### 4.10 Component tests in the browser

Between unit tests and E2E sits **component testing**: render one UI component (a cart widget, a date picker) in a real browser, in isolation, and interact with it (Playwright component testing, Cypress component testing, Storybook interaction tests). It's fast and precise for UI logic, without needing the whole app.

## 5. Architecture: the E2E suite around Quality Books

![The E2E suite around Quality Books: playwright.config.js sets projects, baseURL, the web server, retries and reporters for parallel workers; each worker gets a fresh browser context and uses page objects to drive the Quality Books UI, which calls the shop API and the inventory service; page.route() can stub, delay or reorder requests; failures leave a trace, screenshot, video and junit.xml; the matrix config reuses the main config for Topic 2's ten pairwise projects.](../../assets/diagrams/05-architecture.svg#only-light){ loading=lazy }
![The E2E suite around Quality Books: playwright.config.js sets projects, baseURL, the web server, retries and reporters for parallel workers; each worker gets a fresh browser context and uses page objects to drive the Quality Books UI, which calls the shop API and the inventory service; page.route() can stub, delay or reorder requests; failures leave a trace, screenshot, video and junit.xml; the matrix config reuses the main config for Topic 2's ten pairwise projects.](../../assets/diagrams/05-architecture-dark.svg#only-dark){ loading=lazy }

## 6. How it connects with other practices

| Practice | Connection |
|---|---|
| **Test pyramid (Topic 1)** | E2E is the narrow top: a few journeys. Push every rule that doesn't need a browser down a level. |
| **Test design (Topic 2)** | Journeys are scenarios (use cases); configuration coverage is pairwise. |
| **Unit and component (Topic 3)** | UI logic (formatting, state handling) can be component-tested much faster than through E2E. |
| **API and contracts (Topic 4)** | Use the API to set up state; stub with care, because stubs are contracts too. |
| **CI/CD (Topic 6)** | E2E runs after faster stages; sharded across machines; traces uploaded as artefacts; retries reported as flaky. |
| **Test data (Topic 7)** | Isolated, disposable data is what makes parallel E2E stable. |
| **Accessibility (Topic 9)** | Role-based locators and keyboard journeys double as accessibility checks. |
| **Observability (Topic 10)** | The same journeys, run against production on a schedule, become synthetic monitoring. |

## 7. Real-world examples

**1. The stuck cart (this repo).** Ask for four copies of a book that has three: the shop correctly shows *"only 3 in stock"*. But the front end has already put four in its local cart. Every later change, even adding a different book, sends the impossible quantity again and fails. The customer can't continue. Every single-step test passes, including the one that checks the error message. Only a journey (*error, then carry on*) shows it.

**2. The stale total (this repo).** Two quick clicks send two price requests. If the first response arrives last (networks reorder responses all the time), it overwrites the newer total, and the cart shows 1 copy's price for 2 copies. It looks like a "flaky test" until you control the network order and it fails every time. Many real "flaky" UI tests are real race conditions.

**3. The WebKit keyboard surprise (this repo).** The keyboard-only test passes in Chromium and Firefox and fails in every WebKit project of the matrix. Like Safari on macOS, WebKit by default doesn't move focus to buttons with Tab (the "Press Tab to highlight each item" setting). It's not a shop bug: it's a test that assumed one browser's behaviour. Compatibility testing finds wrong assumptions in tests as well as in products.

**4. Google's flaky-test numbers.** Google's 2016 analysis of its CI (about 1.5% of runs flaky; 16% of tests flaky at some point) led to automatic flakiness detection, quarantining, and treating flakiness as a defect with an owner. Many large engineering organisations have published similar programmes since.

**5. The ice-cream cone migration.** A common story: a team with 2,000 UI tests that take hours and fail randomly moves rule checks down to API and unit tests, keeps a few dozen journeys, and cuts the pipeline from hours to minutes, with *more* bugs caught earlier.

## 8. Scaling across applications and teams

| Challenge | What works |
|---|---|
| Suite takes too long | Parallel workers, **sharding** across CI machines (`--shard=1/4`), tagging (`@smoke`, `@critical`) to run the right subset at each stage |
| Many teams, one front end | Each team owns the journeys for its features; shared page/component objects published like code, with owners |
| Flaky tests erode trust | Detect them automatically (passed on retry = flaky), quarantine with an owner and a deadline, track the flaky rate as a team metric (Topic 11) |
| Slow setup through the UI | API-based setup, saved authentication state, seeded test data per worker |
| Cross-browser cost explodes | Pairwise configuration sets; full matrix nightly, smoke set per pull request |
| Debugging failures in CI | Traces, screenshots and videos as CI artefacts; the same container image locally and in CI |

## 9. Security and data privacy

- **Traces and videos contain everything on screen and in the network**: cookies, tokens, emails, sometimes card details. Keep them only on failure, store them with access control, and expire them (this repo keeps them 14 days).
- **Saved authentication state is a credential.** `storageState` files hold session cookies; never commit them, and use dedicated test accounts with minimal rights.
- **Test accounts in production** (for synthetic journeys) must be clearly marked, excluded from analytics and billing, and unable to reach real customers' data.
- **Stubbed third parties** mean your tests never exercise the real payment or identity provider's security checks. Cover those with provider sandboxes and contract tests.
- **Front-end security checks belong here too:** that untrusted text is rendered as text, never HTML (the shop's `assistant.spec.js` checks the AI's answer can't inject markup), that pages behave without third-party scripts, and that errors don't leak internals. Topic 9 goes further.

## 10. Performance, maintenance, and cost

| Concern | Guidance |
|---|---|
| **Speed** | A browser test takes about a second; this lab's 14 E2E tests run in a few seconds in parallel. A thousand of them is a different story: budget your E2E time like a resource. |
| **Compute cost** | Browsers are CPU- and memory-heavy; cross-browser multiplies it. Pairwise and tagging keep cost in check. |
| **Maintenance** | Locators and page objects absorb UI change. Brittle selectors and copy-pasted steps multiply it. |
| **Flakiness cost** | Every flaky failure costs an investigation and erodes trust. Treat a flaky test as a bug with an owner. |
| **Debuggability** | Traces turn a red CI run into a replayable recording; that saves hours per failure. |
| **Deleting tests** | An E2E test that duplicates lower-level coverage costs minutes per run, forever. Delete or push it down. |

## 11. Common problems and failure scenarios

| Problem | Symptom | Fix |
|---|---|---|
| **Fixed sleeps** | Fails on slow days, wastes time on fast ones | Web-first assertions; expose UI state |
| **One-shot reads** | `expect(await x.count())` fails intermittently | `await expect(x).toHaveCount(n)` |
| **Structural selectors** | Tests break on every redesign | Role, label, test id |
| **UI used for setup** | Long, fragile tests | API setup, saved auth state |
| **Shared data between tests** | Fails in parallel or in a different order | Unique data per test; fresh context |
| **Hard-coded URLs and ports** | Fails in CI or on another environment | `baseURL` and `page.goto('/')` |
| **Retries as a fix** | Green builds, real bugs hidden | Report flaky tests; fix the cause |
| **Too many E2E tests** | Hours-long pipelines | Move rule checks down the pyramid |
| **Assuming one browser's behaviour** | Fails only in WebKit or Firefox | Run a configuration matrix; write browser-aware tests where behaviour legitimately differs |

## 12. Important trade-offs

- **Confidence vs speed.** E2E gives the most realistic confidence per test and the slowest feedback. A small, high-value E2E suite plus strong lower layers beats a large E2E suite.
- **Real back end vs stubbed.** The real back end catches integration bugs; stubs give speed and determinism. Use real for the critical journeys and stubs for timing, failures and third parties.
- **Test ids vs user-facing locators.** User-facing locators also test accessibility, but change when copy changes. Test ids are stable but invisible to users. Prefer user-facing, fall back to test ids.
- **Cross-browser breadth vs cost.** Full matrices catch rare differences at many times the cost. Pairwise plus your real users' top configurations is usually the sweet spot.
- **Visual testing vs noise.** Pixel comparisons catch real layout bugs and produce false positives from fonts and rendering. Worth it for design-critical pages, with stable baselines.

## 13. Comparisons

### Browser automation tools

| Tool | Architecture | Browsers | Strengths | Watch out for |
|---|---|---|---|---|
| **Playwright** (used here) | Out-of-process, own protocols | Chromium, Firefox, WebKit | Auto-waiting, web-first assertions, contexts, tracing, network control, many languages | Patched browser builds, not your users' exact branded browsers (channels for Chrome and Edge exist) |
| **Cypress** | Runs inside the browser alongside the app | Chromium-family, Firefox, WebKit (experimental) | Excellent developer experience, time-travel debugging | Single-tab, same-origin limits (relaxed in recent versions), JavaScript only |
| **Selenium WebDriver** | W3C WebDriver protocol, driver per browser | All major, real branded browsers | The standard; every language; Grid for scale | More waiting and setup by hand; WebDriver BiDi is modernising it |
| **WebdriverIO** | WebDriver and BiDi/DevTools | All major, plus mobile via Appium | Flexible, big plugin ecosystem | More configuration |
| **Puppeteer** | CDP (and WebDriver BiDi) | Chrome, Firefox | Lightweight automation and scraping | Not a full test framework |
| **Appium** | WebDriver for native mobile | iOS, Android apps | Real native apps and devices | Slow and complex setup |

### Approaches to UI test maintenance

| Approach | Idea | Trade-off |
|---|---|---|
| Page objects / Screenplay | Hand-written abstractions | Explicit and reviewable; you maintain them |
| Record-and-playback | Generate tests by clicking through | Fast to create; brittle and hard to review |
| "Self-healing" locators (AI) | The tool re-finds an element when a locator breaks | Less maintenance; can silently test the wrong element (Topic 12) |
| AI agents exploring the UI | An agent pursues a goal through the browser | Finds unexpected paths; non-deterministic; needs an oracle (Topic 12) |
