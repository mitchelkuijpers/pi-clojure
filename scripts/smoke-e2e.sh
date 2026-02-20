#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v pi >/dev/null 2>&1; then
  echo "[e2e] ERROR: pi is not installed or not on PATH"
  exit 1
fi

MODEL=""
if [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
  MODEL="sonnet:low"
elif [[ -n "${OPENAI_API_KEY:-}" ]]; then
  MODEL="openai/gpt-4o-mini"
elif [[ -n "${GOOGLE_API_KEY:-}" ]]; then
  MODEL="google/gemini-2.5-flash"
else
  echo "[e2e] SKIP: No provider API key found (ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY)."
  exit 0
fi

TMP_PI_HOME="$(mktemp -d)"
trap 'rm -rf "$TMP_PI_HOME"' EXIT

echo "[e2e] Running API-backed print mode smoke test with model: $MODEL"
OUTPUT="$({
  PI_CODING_AGENT_DIR="$TMP_PI_HOME" \
    pi -p \
      --no-session \
      --model "$MODEL" \
      --no-extensions \
      -e "$ROOT_DIR/extensions/clojure.ts" \
      "Reply with exactly: PI_CLOJURE_E2E_OK"
} 2>&1)"

if ! grep -Fq "PI_CLOJURE_E2E_OK" <<<"$OUTPUT"; then
  echo "[e2e] ERROR: Expected success marker not found"
  echo "$OUTPUT"
  exit 1
fi

echo "[e2e] E2E smoke test passed"
