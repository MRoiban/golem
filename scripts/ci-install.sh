#!/usr/bin/env bash
# CI install. Onyx comes from a GitHub release tarball; when GitHub's release download URL fails
# (it returned 504 for over an hour on 2026-11-08), fetch the same asset through the GitHub API,
# check it against the sha512 recorded in bun.lock, and install it from the local file.
set -euo pipefail
URL=https://github.com/MRoiban/onyx/releases/download/v0.2.2/mroiban-onyx-0.2.2.tgz

for i in 1 2; do
  bun install --frozen-lockfile && exit 0
  echo "bun install failed (attempt $i); retrying in 30 s"; sleep 30
done

echo "Falling back to the GitHub API for $URL"
TAG=$(echo "$URL" | sed -E 's#.*/download/([^/]+)/.*#\1#')
FILE=$(basename "$URL")
ID=$(gh api "repos/MRoiban/onyx/releases/tags/$TAG" --jq ".assets[] | select(.name == \"$FILE\") | .id")
TGZ="${RUNNER_TEMP:-/tmp}/$FILE"
gh api -H "Accept: application/octet-stream" "repos/MRoiban/onyx/releases/assets/$ID" > "$TGZ"
WANT=$(grep -F "\"@mroiban/onyx@$URL\"" bun.lock | grep -o 'sha512-[A-Za-z0-9+/=]*' | head -1)
GOT="sha512-$(openssl dgst -sha512 -binary "$TGZ" | base64 -w0)"
if [ "$WANT" != "$GOT" ]; then echo "Onyx tarball hash mismatch: want $WANT, got $GOT"; exit 1; fi
echo "Hash matches bun.lock ($WANT)"
[ -n "${GITHUB_ENV:-}" ] && echo "ONYX_TGZ=$TGZ" >> "$GITHUB_ENV"  # for scripts/smoke-pack.ts
grep -rl --include=package.json --exclude-dir=node_modules --exclude-dir=anima "$URL" . | xargs sed -i "s#$URL#file:$TGZ#"
bun install
