#!/usr/bin/env bash
# Build a git ref in a throwaway worktree and fail if its committed dist/
# differs from what `npm run build` produces. Same check as
# .github/workflows/check-dist.yaml, runnable locally against any ref.
#
# Usage: scripts/check-dist.sh [ref]       (default: HEAD)
#        npm run check-dist -- origin/main
#
# Uncommitted changes are not checked, the worktree is built from the ref.
#
# Node: package.json pins engines.node and .npmrc sets engine-strict, so with
# any other Node major `npm ci` refuses to install. When the Node on PATH is
# the wrong major this uses $NODE_BIN_DIR, or else the newest matching
# install under ${NVM_DIR:-~/.nvm}/versions/node, and fails if neither has it.
#
# What it fixed: a local run with Node 26 had `npm ci` exit on EBADENGINE
# with its output hidden, so the build never ran and an empty diff read as
# "dist is clean". Every step here prints its output and stops on failure.
set -euo pipefail

ref="${1:-HEAD}"
repo="$(git rev-parse --show-toplevel)"
cd "$repo"

sha="$(git rev-parse --verify --quiet "$ref^{commit}")" || {
  echo "check-dist: not a commit: $ref" >&2
  exit 2
}

want="$(sed -n 's/^ *"node": *"\([0-9][0-9]*\).*/\1/p' package.json | head -1)"
if [[ -z "$want" ]]; then
  echo "check-dist: no engines.node major in package.json" >&2
  exit 2
fi

node_major() { "$1/node" -p 'process.versions.node.split(".")[0]' 2>/dev/null || true; }

current_dir="$(dirname "$(command -v node 2>/dev/null || echo /nonexistent/node)")"
if [[ "$(node_major "$current_dir")" != "$want" ]]; then
  candidate="${NODE_BIN_DIR:-}"
  if [[ -z "$candidate" ]]; then
    nvm_versions="${NVM_DIR:-$HOME/.nvm}/versions/node"
    match="$(ls -d "$nvm_versions"/v"$want".* 2>/dev/null | sort -V | tail -1 || true)"
    [[ -n "$match" ]] && candidate="$match/bin"
  fi
  if [[ -z "$candidate" || "$(node_major "$candidate")" != "$want" ]]; then
    echo "check-dist: need Node $want, found $(node -v 2>/dev/null || echo none)." >&2
    echo "check-dist: install it, or set NODE_BIN_DIR to its bin directory." >&2
    exit 2
  fi
  export PATH="$candidate:$PATH"
fi
echo "check-dist: node $(node -v), ref $ref ($sha)"

worktree="$(mktemp -d "${TMPDIR:-/tmp}/check-dist.XXXXXX")"
cleanup() { git -C "$repo" worktree remove --force "$worktree" 2>/dev/null || rm -rf "$worktree"; }
trap cleanup EXIT

git worktree add --quiet --detach "$worktree" "$sha"
cd "$worktree"
npm ci --no-audit --no-fund
npm run build

if [[ -n "$(git diff --ignore-space-at-eol --name-only dist/)" ]]; then
  echo "check-dist: dist/ at $ref does not match a fresh build:" >&2
  git diff --ignore-space-at-eol --stat dist/ >&2
  exit 1
fi
echo "check-dist: dist/ at $ref matches a fresh build"
