# Security, accessibility and compatibility notes

Topic 9. Reference answer (the dependency list is from October 2026; yours may differ).

## Step 1 — Dependency findings

| Package | Severity | Production or dev only | My decision (fix now, accept with reason, watch) |
|---|---|---|---|
| node-forge (via jks-js, via promptfoo) | High | Dev only | Accept for now: only promptfoo's Java-keystore support uses it, and the evals never load keystores. Watch for a promptfoo release with a fixed node-forge; review again in 30 days |
| qs (via typed-rest-client) | Moderate | Dev only | Fix now with plain `npm audit fix`: a non-breaking update of a transitive package |

Why I didn't simply run the "fix" npm suggested: for the high findings it suggests `promptfoo@0.116.7`, a breaking *downgrade* of a tool the course uses, to fix code we never run. A "fix" can cost more than the risk it removes; read it first.

## Step 2 — Security headers

What each header I added protects against: `Content-Security-Policy` stops injected or third-party scripts from running (`default-src 'self'`) and stops other sites from framing the shop for clickjacking (`frame-ancestors 'none'`). `X-Content-Type-Options: nosniff` stops browsers from treating a file as a script because it looks like one. `Referrer-Policy: no-referrer` stops URLs leaking to other sites. Removing `X-Powered-By` stops advertising the framework to scanners.

## Step 3 — The internal API

The abuse case in one sentence ("As an attacker, I…"): as an attacker, I call the published inventory port every 15 minutes and reserve every copy of every book, so customers see the whole shop as sold out without me ever touching the shop.

Why "it's internal" isn't a defence, and what else I'd do besides a shared token: anything that can reach the port can call it: a published port, another compromised container, a misconfigured firewall. Besides the token I'd stop publishing port 3220, restrict the network so only the shop can reach the service, rotate the token through a secret store, cap reservation sizes, and alert on unusual reservation rates.

## Step 4 — Accessibility

What the standard axe rules missed, and how a voice-control or screen-reader user experienced each problem: the buttons' names ("Add The Pragmatic Tester to cart") didn't contain what they showed ("Out of stock"), so a voice-control user saying "click Add to cart" matched nothing, and a screen-reader user heard an invitation to add a sold-out book. The cart total changed without any announcement, so a screen-reader user had no idea anything happened after pressing the button. Standard rules passed; the experimental rule and listening with VoiceOver found them.

Which Topic 5 test depended on the old button name, and what that says about locators: "out-of-stock books cannot be added" located the button by the exact name "Add The Pragmatic Tester to cart", so it was asserting the misleading name as correct. Locators should use roles and the meaningful part of a name, and a name that doesn't match what users see is a finding, not a locator.

## Step 5 — Compatibility

The WebKit keyboard finding from Topic 5's matrix: platform behaviour, and a test bug. Safari by default only tabs to text fields, so the test assumed Chromium's behaviour. My strategy: keep keyboard journeys in the matrix with a browser-aware key (Alt+Tab in WebKit), add one manual check per release in real Safari with "Press Tab to highlight each item" both off and on, and document Safari's keyboard behaviour in the support policy.
