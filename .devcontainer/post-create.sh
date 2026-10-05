#!/usr/bin/env bash
# Runs once when the dev container is created.
set -euo pipefail

K6_VERSION=v2.3.0
ARCH=$(dpkg --print-architecture)   # amd64 | arm64

echo "▸ npm dependencies"
npm ci

echo "▸ Playwright Chromium (+ system libraries)"
npx playwright install --with-deps chromium

echo "▸ k6 ${K6_VERSION}"
curl -fsSL "https://github.com/grafana/k6/releases/download/${K6_VERSION}/k6-${K6_VERSION}-linux-${ARCH}.tar.gz" \
  | sudo tar -xz --strip-components=1 -C /usr/local/bin "k6-${K6_VERSION}-linux-${ARCH}/k6"

echo "▸ MkDocs (docs preview)"
pip install --user -r requirements-docs.txt

echo
npm run learn:doctor || true
echo "Next: read docs/start/how-it-works.md, then: npm run learn:start 1   ·   course site: mkdocs serve -a 0.0.0.0:8000"
