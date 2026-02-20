#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[offline] Installing dependencies"
npm ci

echo "[offline] Running type checks"
npm run typecheck

echo "[offline] Checking pi CLI availability"
if ! command -v pi >/dev/null 2>&1; then
  echo "[offline] ERROR: pi is not installed or not on PATH"
  echo "[offline] Build the Docker image and run smoke tests inside the container."
  exit 1
fi

echo "[offline] pi version"
pi --version

echo "[offline] Checking clojure helper tools"
for tool in bb cljfmt clj-paren-repair clj-nrepl-eval; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "[offline] ERROR: required tool '$tool' is not installed or not on PATH"
    exit 1
  fi
done

echo "[offline] Installing local package into project scope"
pi install "$ROOT_DIR" -l >/tmp/pi-install.log

echo "[offline] Verifying package registration"
if ! pi list | grep -Fq "$ROOT_DIR"; then
  echo "[offline] ERROR: local package source path not found in pi list"
  echo "[offline] install output:"
  cat /tmp/pi-install.log
  exit 1
fi
if ! grep -Fq '"name": "@mitchelkuijpers/pi-clojure"' package.json; then
  echo "[offline] ERROR: package.json name does not match @mitchelkuijpers/pi-clojure"
  exit 1
fi

echo "[offline] Validating expected files"
test -f "extensions/clojure.ts"

echo "[offline] Offline smoke checks passed"
