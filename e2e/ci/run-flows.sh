#!/usr/bin/env bash
set -uo pipefail
TAGS=${1:?usage: run-flows.sh <maestro tags>}
OUT=$PWD/${E2E_OUT:-e2e-out}
APP_IDS="io.twentysixty.mobileagent.dev io.twentysixty.mobileagent.st"
mkdir -p "$OUT/recordings" "$OUT/app-logs"

(
  i=0
  while :; do
    adb shell screenrecord --bit-rate 2000000 "/sdcard/rec-$i.mp4" >/dev/null 2>&1
    i=$((i + 1))
  done
) &
RECORDER=$!
adb logcat -c || true
adb logcat -v time >"$OUT/logcat.txt" 2>/dev/null &
LOGCAT=$!

maestro test --include-tags "$TAGS" --format junit --output "$OUT/junit.xml" \
  --debug-output "$OUT/maestro" --flatten-debug-output e2e/maestro
CODE=$?

kill "$RECORDER" "$LOGCAT" 2>/dev/null
adb shell pkill -INT screenrecord 2>/dev/null
sleep 3
for f in $(adb shell ls /sdcard/ 2>/dev/null | tr -d '\r' | grep '^rec-'); do
  adb pull "/sdcard/$f" "$OUT/recordings/" >/dev/null 2>&1
done

# run-as fails because the e2e build type is not debuggable
adb root >/dev/null 2>&1
sleep 4
adb wait-for-device
for pkg in $APP_IDS; do
  adb pull "/data/data/$pkg/files/hologramLogs" "$OUT/app-logs/$pkg" >/dev/null 2>&1 || echo "no app logs for $pkg"
done
adb unroot >/dev/null 2>&1 || true

exit "$CODE"
