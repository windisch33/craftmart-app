#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
OUT_DIR="$ROOT_DIR/docs/reports/mockups"

IMG() {
  local html="$1"; shift
  local png="$1"; shift
  echo "[render] $html -> $png"
  docker run --rm -v "$ROOT_DIR":/work zenika/alpine-chrome:with-node \
    chromium-browser \
    --headless --disable-gpu --no-sandbox \
    --screenshot="/work/${png}" --window-size=1600,1200 \
    "file:///work/${html}"
}

IMG docs/reports/mockups/sales-by-salesman.html docs/reports/mockups/sales-by-salesman.png
IMG docs/reports/mockups/unpaid-invoices.html   docs/reports/mockups/unpaid-invoices.png
IMG docs/reports/mockups/tax-by-state.html      docs/reports/mockups/tax-by-state.png

echo "Done. PNGs written to $OUT_DIR"

