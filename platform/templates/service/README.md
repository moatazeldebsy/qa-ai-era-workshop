# {{name}}

Created from the platform service template. It starts with the platform
baseline (request ids, security headers, JSON errors), conformance tests, and a
CI workflow (`.github/workflows/service-{{name}}.yml`).

```bash
node services/{{name}}/src/server.js                 # port {{port}}
node --test "services/{{name}}/tests/*.test.js"
```
