#!/usr/bin/env sh
set -eu

export TF_USE_LEGACY_KERAS=1

if command -v git >/dev/null 2>&1 && git lfs version >/dev/null 2>&1; then
  git lfs pull || true
fi

exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8080}"