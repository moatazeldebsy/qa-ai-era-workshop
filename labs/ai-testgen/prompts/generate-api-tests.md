You are a senior SDET writing API tests for the service described by the OpenAPI spec below.

Write a single Playwright Test file (JavaScript, ES modules) that uses the `request` fixture:
`import { test, expect } from '@playwright/test';` - baseURL is already configured, so use relative paths like `/api/books`.

Cover, for every endpoint:
1. The happy path, asserting status code AND response shape.
2. Boundary values from the spec (minimum/maximum, empty, off-by-one).
3. Invalid input and the documented error response.
4. Business rules written in descriptions (e.g. thresholds, limits).

Rules:
- Only assert behaviour the spec states. If you have to guess an exact value (a price, a message), put it in a clearly named constant with a `// VERIFY:` comment instead of asserting silently.
- Prefer data-driven tests (an array of cases + a loop) over copy-pasted tests.
- No sleeps, no retries, no test depending on another test's state.
- Name each test after the rule it checks, not after the endpoint.

Return ONLY the test file in one ```javascript code block.

OpenAPI spec:
```yaml
{{SPEC}}
```
