# Quality update for leadership

Topic 14, step 4. Reference answer.

## Headline

One sentence: where quality stands, and the one decision you need: our core shop is well protected, but we could release a change to the AI assistant without any check that it tells customers the truth, and I'm asking to make those checks mandatory and to fund two weeks to put both services on our shared quality baseline.

## What's working

Two or three facts, with numbers: pricing rules are checked across every one of the ~19,000 possible carts, so the shipping bug class can't come back unnoticed; 74 fast unit and component tests against 14 browser tests means most problems are found in seconds, not minutes; no known vulnerable dependency ships to customers today.

## What worries us

Two or three risks, in customer and business terms, not test terms: (1) the assistant could quote a price we don't honour, as happened publicly to Air Canada, and nothing stops such a change from being released; (2) customers could order books we don't have in stock: our tests said this was covered, but it wasn't; (3) our two services handle errors and security differently, so every fix has to be found and made twice.

## What we're asking for

The investment or decision, its cost, and what it buys: a decision that AI evidence is required for every release (no cost, a policy change), and two engineer-weeks to move both services onto the shared baseline and close the stock gap. That buys protection for our three highest risks and halves the effort of every future cross-cutting fix.

## How we'll report progress

Which two or three numbers you'll show next time, and why those: releases shipped without AI evidence (target 0), services meeting all platform standards (target 2 of 2), and production defects found by customers (target 0 pricing or stock defects this quarter). They're the outcomes these investments are meant to change.
