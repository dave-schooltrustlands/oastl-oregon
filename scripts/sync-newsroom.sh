#!/usr/bin/env bash
# v84 — Sync newsroom content from the canonical ASTL repo into this repo.
#
# Runs as a prebuild hook so a fresh `npm run build` always picks up the
# latest issues. Cloudflare Workers' build sandbox has no access to a
# sibling repo, so the synced files MUST be committed in this repo too —
# this script is a developer convenience for keeping the committed copy
# fresh before pushing.
#
# Idempotent. Safe to re-run. Will skip silently if ASTL repo isn't at the
# expected sibling path (Cloudflare build environment, etc.).

set -euo pipefail

ASTL_REPO="${ASTL_REPO:-../schooltrustlands}"
SRC_DIR="$ASTL_REPO/src/content/newsroom"
DST_DIR="src/content/newsroom"

if [ ! -d "$SRC_DIR" ]; then
  echo "[sync-newsroom] ASTL repo not found at $ASTL_REPO — skipping sync (build sandbox or fresh clone)."
  exit 0
fi

mkdir -p "$DST_DIR"

# Copy all .md files (Newsroom issues). Preserve mtime; overwrite existing.
synced=0
for f in "$SRC_DIR"/*.md; do
  [ -e "$f" ] || continue
  cp -p "$f" "$DST_DIR/"
  synced=$((synced + 1))
done

echo "[sync-newsroom] Synced $synced issue(s) from $SRC_DIR → $DST_DIR"
