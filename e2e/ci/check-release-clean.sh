#!/usr/bin/env bash
set -euo pipefail
cd android

if ./gradlew :app:tasks --all | grep -q assembleProdE2e; then
  echo "the prod flavor must not have an e2e variant" >&2
  exit 1
fi

./gradlew :app:processDevReleaseMainManifest :app:mergeDevReleaseResources \
  :app:processDevE2eMainManifest :app:mergeDevE2eResources -PreactNativeArchitectures=x86_64

has_test_ca() {
  [ -n "$(find app/build/intermediates -path "*$1*" -name '*e2e_test_ca*' -print -quit)" ]
}

has_network_config() {
  find app/build/intermediates/merged_manifest -path "*$1*" -name AndroidManifest.xml -print0 |
    xargs -0 grep -q networkSecurityConfig
}

# The e2e side proves that the paths below still find these files
has_test_ca devE2e || { echo "check is stale: no test CA found in devE2e" >&2; exit 1; }
has_network_config devE2e || { echo "check is stale: no networkSecurityConfig found in devE2e" >&2; exit 1; }

if has_test_ca devRelease; then
  echo "a release build contains the test CA" >&2
  exit 1
fi
if has_network_config devRelease; then
  echo "a release build has the e2e networkSecurityConfig" >&2
  exit 1
fi
echo "release build is clean"
