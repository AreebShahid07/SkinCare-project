#!/usr/bin/env sh
set -eu

if ! command -v git-lfs >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update
    apt-get install -y git-lfs
  fi
fi

git lfs install
git lfs pull

pip install -r requirements.txt