#!/usr/bin/env sh
set -eu

if ! command -v git-lfs >/dev/null 2>&1; then
  apt-get update && apt-get install -y git-lfs
fi

git lfs install
git lfs pull

# Verify models actually downloaded (not just LFS pointers)
for f in backend/assets/skin_type_final.keras backend/assets/condition_final.keras; do
  size=$(wc -c < "$f")
  if [ "$size" -lt 1000000 ]; then
    echo "ERROR: $f looks like an LFS pointer ($size bytes), not a real model file"
    exit 1
  fi
done

pip install -r requirements.txt