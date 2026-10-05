# Test environments and test data notes

Topic 7. Replace every ✏️.

## Step 1 — Three environments

| | In-process tests | `npm run start:all` | Docker Compose |
|---|---|---|---|
| How long to start | ✏️ | ✏️ | ✏️ |
| How close to production | ✏️ | ✏️ | ✏️ |
| Who else can break it | ✏️ | ✏️ | ✏️ |

One thing that's different between my laptop and a container, that could make a test pass in one and fail in the other: ✏️

## Step 2 — Shared data

Why the three shared-environment tests pass one at a time and fail together: ✏️

Why "reset the data before each test" is not a fix in a shared environment: ✏️

Why the test-data API must never be switched on in production: ✏️

## Step 3 — Realistic data finds bugs

Why the hand-made fixture couldn't find the report bug: ✏️

Why a reproducible generator matters when a test fails: ✏️

## Step 4 — Masking

The three problems the PII scan found in the original masking, and how I fixed each: ✏️

One way my masked data could still identify a person: ✏️
