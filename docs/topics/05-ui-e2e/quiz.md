# Topic 5 · Quiz & wrap-up

## Quiz

Ten questions about understanding, not recall. Pick an answer to see whether it's right and why. Your best score is saved on this device.

<div class="quiz" data-quiz="05" markdown>

<div class="quiz-q" markdown>

**1. Why is `await expect(locator).toHaveCount(2)` more reliable than `expect(await locator.count()).toBe(2)`?**

- [ ] It's shorter
- [x] It keeps re-checking until the count matches or the timeout expires; the other reads once
- [ ] `count()` is deprecated
- [ ] It runs in the browser instead of Node

<div class="quiz-why" markdown>
Web-first assertions retry against the live page. A one-shot read checks at whatever instant the code reaches it, which is the root of most flaky UI tests.
</div>

</div>

<div class="quiz-q" markdown>

**2. Which locator is most likely to survive a redesign of the shop page?**

- [ ] `#book-list > li:nth-child(1) > button`
- [x] `getByRole('button', { name: 'Add Testing in Production to cart' })`
- [ ] `//div[3]/ul/li[1]/button`
- [ ] `.book button.primary`

<div class="quiz-why" markdown>
Role plus accessible name describes what the user sees, not how the page is built. It also fails when the button loses its accessible name: a real accessibility bug.
</div>

</div>

<div class="quiz-q" markdown>

**3. A test sleeps 700 ms before checking recommendations that take 200–1500 ms. What's the right fix?**

- [ ] Sleep 2000 ms
- [ ] Add two retries
- [x] Assert on the condition with a web-first assertion, or stub the slow dependency
- [ ] Run it only on fast machines

<div class="quiz-why" markdown>
Longer sleeps just move the failure and slow every run; retries hide it. Wait for the condition itself, or control the dependency.
</div>

</div>

<div class="quiz-q" markdown>

**4. Every single-step cart test passes, but customers get stuck after one stock error. What kind of test finds this?**

- [ ] A unit test of the pricing function
- [x] A journey test: an error, then trying to carry on
- [ ] A contract test
- [ ] A visual snapshot

<div class="quiz-why" markdown>
The bug lives in client-side state carried from one step to the next. Only a sequence of actions shows it.
</div>

</div>

<div class="quiz-q" markdown>

**5. Why does the lab's race test hold the first response back, rather than adding a delay to it?**

- [ ] Delays aren't supported by page.route
- [x] Holding it until the second answer is shown fixes the order for certain; a delay only makes that order likely
- [ ] It makes the test faster
- [ ] So the server sees fewer requests

<div class="quiz-why" markdown>
A delay is a guess about timing, which is exactly what makes tests flaky. Controlling the order makes the failure repeatable every run.
</div>

</div>

<div class="quiz-q" markdown>

**6. What does a Playwright browser context give each test?**

- [ ] A new browser process
- [x] Fresh cookies, storage and cache, like a new incognito window, created in milliseconds
- [ ] A separate copy of the server
- [ ] A recorded video

<div class="quiz-why" markdown>
Contexts make isolation cheap, so tests can't leak login state or cart contents into each other.
</div>

</div>

<div class="quiz-q" markdown>

**7. The keyboard test passes in Chromium and Firefox but fails in WebKit. What's the most likely explanation?**

- [ ] WebKit can't run keyboard tests
- [x] WebKit, like Safari, doesn't move focus to buttons with Tab by default, so the test assumed one browser's behaviour
- [ ] The shop is broken in Safari
- [ ] The test is flaky

<div class="quiz-why" markdown>
Compatibility testing finds wrong assumptions in tests as well as in products. Here the fair fix is a browser-aware key, with a comment explaining why.
</div>

</div>

<div class="quiz-q" markdown>

**8. Your E2E suite takes 90 minutes. Which change gives the biggest, safest win?**

- [ ] Raise every timeout
- [x] Move rule checks that don't need a browser down to API and unit tests, and shard what's left
- [ ] Delete all E2E tests
- [ ] Add retries to the slow ones

<div class="quiz-why" markdown>
E2E is the narrow top of the pyramid. Most suites are slow because they test rules through the browser that lower levels test in milliseconds.
</div>

</div>

<div class="quiz-q" markdown>

**9. When should a test stub the network with `page.route`?**

- [ ] Always, to make tests fast
- [x] For dependencies you don't control, for failures and timing you need to reproduce; not for the journeys whose integration you want to prove
- [ ] Never: it makes tests unrealistic
- [ ] Only in production

<div class="quiz-why" markdown>
Stubs give determinism and speed, but every stub is an assumption about the real API (Topic 4). Use the real back end where the integration is the point.
</div>

</div>

<div class="quiz-q" markdown>

**10. What do retries in CI do to a flaky test?**

- [ ] Fix it
- [x] Hide it unless retried passes are reported as flaky and followed up
- [ ] Make it deterministic
- [ ] Turn it into a unit test

<div class="quiz-why" markdown>
One retry can keep a pipeline moving, but only if "passed on retry" is visible, owned and fixed. Otherwise the suite quietly stops being trustworthy.
</div>

</div>

</div>

## Wrap-up

### Mental model

> **An E2E test is an expensive, realistic experiment. Spend it on journeys, and make it deterministic.**
>
> Ask a browser test only what lower layers can't answer: journeys across steps, real timing, the browser itself. Find things the way a user does (roles and labels). Wait for conditions, never for clocks. Control what you can't trust (the network, third parties, timing). When a test is "flaky", assume first that it found a real race. And spread your browser and device coverage with a model (pairwise), not with hope.

### 10 key things to remember

1. **Few, valuable journeys.** Push every rule that doesn't need a browser down the pyramid.
2. **Locators describe what users see:** role and name first, label and text next, test ids as a fallback.
3. **Wait for conditions, not time.** Web-first assertions retry; sleeps guess.
4. **Expose async state** (`aria-busy`, status messages): better for users and for tests.
5. **Control the network** to stub dependencies, inject failures and reproduce races on purpose.
6. **Journeys find state bugs** that every single-step test misses.
7. **A flaky test is a bug.** In the test, or in the product: find out which.
8. **Retries hide, they don't heal.** Report retried passes as flaky and fix them.
9. **Isolate every test:** fresh context, its own data, API setup instead of UI setup.
10. **Model your configuration coverage** (pairwise), and expect the matrix to test your tests' assumptions too.

### Common mistakes

- Using E2E tests to check business rules that belong in unit and API tests.
- `waitForTimeout` anywhere in a test.
- One-shot reads (`textContent()`, `count()`) followed by plain `expect`.
- Structural CSS or XPath selectors.
- Logging in through the UI in every test.
- Tests that depend on each other's data or order.
- Blanket retries without flaky reporting.
- Running only Chromium, or every test in every browser.
- Keeping traces and videos with real customer data forever.

### Hands-on challenge

**Searching while typing.** The search box sends a request on every keystroke (`input` event).

1. Write a journey test that types `k6` quickly and then deletes it, and check the list ends up showing all six books. Then use `page.route` to make the request for `"k"` arrive **last**. What does the customer see? Is it the same class of bug as step 3?
2. Fix it in `app/public/app.js` without adding a debounce (then add a debounce too, and think about what each fix protects against).
3. The keyboard test failed on WebKit. Make it browser-aware, and add a comment linking to why.
4. **Stretch:** add a visual check for the cart with `toHaveScreenshot()`, run it twice, then change the cart's colour in `styles.css` and watch it catch the change. Where would its baselines have to be generated for CI to trust them?

Post your race-condition test in the discussions. There are several good ways to control the order of responses.

### What to learn next

**Topic 6 — CI/CD and Continuous Testing.** You now have unit, mutation, API, contract and E2E tests. Topic 6 puts them in a pipeline: in what order, how fast, on which changes, and how their evidence becomes one release decision. You'll build stages, shard and select tests, and tune a quality gate that blocks the pricing regression without blocking everything else.

Read before Topic 6 (optional):

- Playwright docs, [*Best Practices*](https://playwright.dev/docs/best-practices) and [*Locators*](https://playwright.dev/docs/locators)
- John Micco, *Flaky Tests at Google and How We Mitigate Them* (Google Testing Blog, 2016)
- Martin Fowler, [*Eradicating Non-Determinism in Tests*](https://martinfowler.com/articles/nonDeterminism.html)

When you've finished the lab and the challenge, move on to [Topic 6](../06-ci-cd/index.md).
