#!/bin/bash
# Links local credo-ts fork build output into hologram's node_modules.
# Usage: bash scripts/link-credo-fork.sh
# After making changes in credo-ts-forked, run: cd credo-ts-forked && pnpm build && cd - && bash scripts/link-credo-fork.sh

FORK=/Users/tarunvadde/Development/credo-ts-forked/packages
NM=/Users/tarunvadde/Development/2060.io/hologram-app/node_modules/@credo-ts

PACKAGES="action-menu anoncreds askar core didcomm openid4vc question-answer react-native webvh"

for pkg in $PACKAGES; do
  if [ -d "$FORK/$pkg/build" ] && [ -d "$NM/$pkg" ]; then
    rm -rf "$NM/$pkg/build"
    cp -r "$FORK/$pkg/build" "$NM/$pkg/build"
    echo "✓ @credo-ts/$pkg"
  else
    echo "✗ @credo-ts/$pkg (no fork build or not installed)"
  fi
done

# Dedup nested copies pulled in by transitive deps
find "$NM/.." -mindepth 3 -path "*/node_modules/@credo-ts" -type d -exec rm -rf {} + 2>/dev/null
echo "✓ Deduped nested copies"

echo "Done. Restart Metro with --reset-cache."
