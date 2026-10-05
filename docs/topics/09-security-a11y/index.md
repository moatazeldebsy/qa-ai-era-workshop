# Topic 9 — Security, Accessibility, and Compatibility Testing

*Is it safe against people trying to break it, usable by everyone, and does it work everywhere it claims to?*

Three quality attributes that functional tests rarely touch, and that attackers, disabled customers and regulators find first. In this topic you'll triage a real `npm audit` report without panicking, and harden the shop's HTTP responses. You'll close an abuse case on the internal inventory API that no scanner would report. And you'll fix two accessibility barriers that the standard automated rules miss entirely. Compatibility ties back to the browser matrix from Topic 5.

<div class="topic-progress" data-topic="09"></div>

## What you'll be able to do

- Explain confidentiality, integrity and availability, and map risks with STRIDE and the OWASP Top 10.
- Choose between SAST, SCA, DAST, secret scanning and penetration testing, and know what each misses.
- Triage dependency vulnerabilities by severity, reachability and production exposure.
- Write security tests for headers, authentication and abuse cases.
- Test accessibility against WCAG 2.2, and know what automated tools can't see.
- Plan compatibility coverage across browsers, devices, locales and assistive technology.

## Before you start

Finish [Topic 8](../08-performance/index.md) first. You need Chromium for the accessibility tests. A screen reader (VoiceOver on macOS, NVDA on Windows) is useful for step 4 but not required.

## How to work through this topic

| Page | What you do | Time |
|---|---|---|
| [Concepts](concepts.md) | Read sections 1–13: threat modelling, OWASP, headers, supply chain, abuse cases, WCAG, compatibility | ~2.5 h |
| [Lab](lab.md) | Triage dependencies, harden headers, secure an internal API, fix two accessibility barriers | ~2.5 h |
| [Quiz & wrap-up](quiz.md) | Check your understanding, then take on the challenge | ~45 min |

```bash
npm run learn:start 9     # your own branch for this topic
npm run learn:check 9     # after each lab step: ✔ or what's missing
```

## What you'll come away with

- A dependency triage with recorded decisions, instead of a frightening total.
- Hardened responses, and an internal API that refuses callers without a token.
- Buttons that say what they show, and a cart that announces its total.

!!! question "Stuck, or want to compare notes?"
    Ask in the [course discussions](https://github.com/moatazeldebsy/qa-engineering-deep-dive/discussions) under **Topic 09**. When you've finished, post your notebook or your challenge solution there too.
