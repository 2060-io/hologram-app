#!/usr/bin/env bash
set -uo pipefail
TAGS=${1:?usage: run-flows.sh <maestro tags>}
OUT=$PWD/${E2E_OUT:-e2e-out}
APP_IDS="io.twentysixty.mobileagent.dev io.twentysixty.mobileagent.st"
# Outside /sdcard, where the media picker lists the recordings and a flow can attach one
REC_DIR=/data/local/tmp/e2e-rec
mkdir -p "$OUT/recordings" "$OUT/app-logs"
adb shell "rm -rf $REC_DIR && mkdir -p $REC_DIR"

(
  i=0
  while :; do
    adb shell screenrecord --bit-rate 2000000 "$REC_DIR/rec-$i.mp4" >/dev/null 2>&1 || sleep 2
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
for f in $(adb shell ls "$REC_DIR" 2>/dev/null | tr -d '\r' | grep '^rec-'); do
  adb pull "$REC_DIR/$f" "$OUT/recordings/" >/dev/null 2>&1 || echo "could not pull $f"
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
