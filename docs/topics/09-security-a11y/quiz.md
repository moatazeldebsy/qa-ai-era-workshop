# Topic 9 · Quiz & wrap-up

## Quiz

Ten questions about understanding, not recall. Pick an answer to see whether it's right and why. Your best score is saved on this device.

<div class="quiz" data-quiz="09" markdown>

<div class="quiz-q" markdown>

**1. `npm audit` reports 3 high vulnerabilities, all in a test tool's transitive dependencies; production dependencies have none. What's the best first move?**

- [ ] Run `npm audit fix --force` immediately
- [x] Triage: confirm they're development-only, read what the suggested fix does, and record a decision
- [ ] Ignore npm audit forever
- [ ] Remove all dependencies

<div class="quiz-why" markdown>
Severity alone doesn't decide urgency: reachability and production exposure do. Here the suggested 'fix' was a breaking downgrade of the test tool.
</div>

</div>

<div class="quiz-q" markdown>

**2. The inventory service is internal. Why does it still need authentication?**

- [ ] It doesn't: internal services are trusted
- [x] Anyone who can reach it (a published port, a compromised container, a network change) can abuse it; zero trust means every caller proves who it is
- [ ] Only for performance reasons
- [ ] Because Pact requires it

<div class="quiz-why" markdown>
Network position is not identity. The lab's abuse case (holding every book) needed no access to the shop at all.
</div>

</div>

<div class="quiz-q" markdown>

**3. Why compare service tokens with `crypto.timingSafeEqual` rather than `===`?**

- [ ] It's faster
- [x] `===` can stop at the first different character, so response times leak how much of a guess was right
- [ ] `===` doesn't work on strings
- [ ] It encrypts the token

<div class="quiz-why" markdown>
A timing side channel lets an attacker discover a secret one character at a time. Constant-time comparison removes it.
</div>

</div>

<div class="quiz-q" markdown>

**4. Which header stops other sites from embedding the shop in a frame (clickjacking)?**

- [ ] X-Content-Type-Options: nosniff
- [x] Content-Security-Policy with frame-ancestors 'none' (or the older X-Frame-Options: DENY)
- [ ] Referrer-Policy
- [ ] Cache-Control

<div class="quiz-why" markdown>
frame-ancestors controls who may frame the page. nosniff stops content-type guessing; Referrer-Policy limits what URLs leak.
</div>

</div>

<div class="quiz-q" markdown>

**5. The shop's headers were set by middleware, yet a 404 page had a different CSP. Why?**

- [ ] Browsers ignore headers on 404s
- [x] Express's built-in 404 response sets its own Content-Security-Policy, replacing the shop's
- [ ] 404s can't have headers
- [ ] The middleware had a typo

<div class="quiz-why" markdown>
Test every kind of response, including errors and static files. Owning the 404 response keeps the shop's own headers.
</div>

</div>

<div class="quiz-q" markdown>

**6. axe's standard WCAG rules report zero violations. What can you conclude?**

- [ ] The page is fully accessible
- [x] No issue that those rules can detect was found; many WCAG criteria need manual testing
- [ ] Screen readers will work perfectly
- [ ] No further testing is needed

<div class="quiz-why" markdown>
Automated rules cover part of WCAG. The lab's label-in-name and silent-total problems passed the standard scan.
</div>

</div>

<div class="quiz-q" markdown>

**7. A button shows "Add to cart" but its accessible name is "Add Testing in Production to cart". Who is affected most directly?**

- [ ] Mouse users
- [x] Voice-control users, who say what they see ("click Add to cart") and the name doesn't match
- [ ] Nobody: the name is more descriptive
- [ ] Search engines

<div class="quiz-why" markdown>
WCAG 2.5.3 Label in Name: the accessible name must contain the visible text. Start the name with what's shown, then add context.
</div>

</div>

<div class="quiz-q" markdown>

**8. A cart total updates without a page reload. What makes a screen reader announce it?**

- [ ] Making the text bold
- [x] Putting it in a live region, such as an element with role="status"
- [ ] Adding a title attribute
- [ ] Moving focus to the footer

<div class="quiz-why" markdown>
WCAG 4.1.3 Status Messages: changes that don't move focus must be programmatically announced, politely.
</div>

</div>

<div class="quiz-q" markdown>

**9. A Topic 5 test located the out-of-stock button by the exact name "Add The Pragmatic Tester to cart". What did that reveal?**

- [ ] Exact names are always best
- [x] The test had encoded an accessibility bug as expected behaviour, so fixing the bug broke the test
- [ ] Playwright can't find disabled buttons
- [ ] The test was flaky

<div class="quiz-why" markdown>
Tests can lock in wrong behaviour. Locate by role and the meaningful part of the name, and question names that don't match what users see.
</div>

</div>

<div class="quiz-q" markdown>

**10. Before running an active DAST scan against a system, what must you have?**

- [ ] A fast network
- [x] Written permission from the system's owner, and ideally a non-production target
- [ ] A VPN
- [ ] Nothing: scanning is passive

<div class="quiz-why" markdown>
Active scans attack the system: they can change data and trigger incident response. Unauthorised scanning can be illegal.
</div>

</div>

</div>

## Wrap-up

### Mental model

> **Functional tests ask "does it work for honest users on our machines?" This topic asks three other questions: what does it do for dishonest users, for users who don't see, hear or click like you, and for machines that aren't yours?**
>
> Each question needs its own lenses: threat models and abuse cases, assistive technology and WCAG, matrices of browsers, devices and locales. Automated checks cover the patterns. People and domain thinking cover the rest.

### 10 key things to remember

1. **Confidentiality, integrity, availability:** every security question maps to one of them.
2. **Threat-model with STRIDE**, and write abuse cases for *your* domain; scanners don't know what's valuable.
3. **Internal is not a trust boundary.** Authenticate every caller.
4. **Triage dependencies** by reachability and production exposure. Read a fix before you run it.
5. **Security headers are cheap.** Test them on every kind of response, including errors.
6. **Compare secrets in constant time,** and never commit them.
7. **Automated accessibility checks cover part of WCAG.** Test with a keyboard, screen readers, zoom and voice.
8. **Accessible names contain visible labels;** status changes are announced.
9. **Native HTML first, ARIA second.**
10. **Compatibility is a promise.** Define support tiers from data and test them with a matrix.

### Common mistakes

- "It's internal, so it doesn't need authentication."
- Treating a scanner report as the whole security picture, or as a to-do list to fix blindly.
- `npm audit fix --force` without reading it.
- Headers on pages but not on errors or static files.
- "axe passes, so we're accessible."
- ARIA attributes that override better native semantics.
- Tests that encode accessibility bugs as expected behaviour.
- Scanning systems without permission.
- Supporting "all browsers" without saying which.

### Hands-on challenge

**Harden the AI assistant and the rest of the stack.**

1. **Cost abuse.** In `claude` mode every question costs money. Write an abuse case and a test: 100 questions in 10 seconds from one client should get `429 Too Many Requests` after a limit you choose. Implement a small in-memory rate limiter (or use `express-rate-limit`) and test both sides of the limit.
2. **Secret scanning.** Run `npx gitleaks detect` (or install gitleaks) on the repository. What does it find in `compose.yaml`, and is it a real secret? How would you tell the tool?
3. **A DAST baseline.** With Docker: `docker compose up -d`, then `docker run --network host ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://localhost:3210`. Compare its warnings before and after your step 2 fixes.
4. **Keyboard journey.** Write a Playwright test that completes search → add two books → see the total using only the keyboard, and run it in the Topic 5 matrix, making it WebKit-aware.

Share your rate-limit test in the discussions. Testing time windows without sleeping is the interesting part.

### What to learn next

**Topic 10 — Production Quality and Observability.** Tests tell you what was true before release. Topic 10 asks what's true *now*, for real users: logs, metrics and traces, SLOs and error budgets, synthetic monitoring, and how to find out about a problem before customers tell you.

Read before Topic 10 (optional):

- [OWASP Top 10](https://owasp.org/Top10/) and the [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- Adam Shostack, *Threat Modeling: Designing for Security*
- W3C, [*How to Meet WCAG (Quick Reference)*](https://www.w3.org/WAI/WCAG22/quickref/)
- [MDN: HTTP security headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security)

When you've finished the lab and the challenge, move on to [Topic 10](../10-observability/index.md).
