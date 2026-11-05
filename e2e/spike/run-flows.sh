#!/usr/bin/env bash
set -uo pipefail
OUT=${E2E_OUT:-e2e-out}
SUMMARY=${GITHUB_STEP_SUMMARY:-/dev/null}
FAILED=0
mkdir -p "$OUT"

(
  i=0
  while :; do
    adb shell screenrecord --bit-rate 2000000 "/sdcard/rec-$i.mp4" >/dev/null 2>&1
    i=$((i + 1))
  done
) &
RECORDER=$!
adb logcat -c || true
adb logcat -v time >"$OUT/logcat-live.txt" 2>/dev/null &
LOGCAT=$!

run_flow() {
  local name=$1 file=$2 start=$SECONDS code
  mkdir -p "$OUT/$name"
  (cd "$OUT/$name" && maestro test --debug-output debug --flatten-debug-output --format junit --output junit.xml "$OLDPWD/$file" >maestro.log 2>&1)
  code=$?
  (cd "$OUT/$name" && maestro hierarchy >final-hierarchy.json 2>/dev/null) || true
  adb exec-out screencap -p >"$OUT/$name/final.png" 2>/dev/null || true
  local verdict=pass
  [ "$code" -eq 0 ] || { verdict=FAIL; FAILED=1; }
  echo "$name: $verdict in $((SECONDS - start)) s"
  tail -25 "$OUT/$name/maestro.log"
  echo "| $name | $verdict | $((SECONDS - start)) s |" >>"$SUMMARY"
  return "$code"
}

echo "| flow | result | time |" >>"$SUMMARY"
echo "| --- | --- | --- |" >>"$SUMMARY"
run_flow 01-signup-both e2e/maestro/local/01-signup-both.yaml
run_flow 02-p2p-text-image e2e/maestro/local/02-p2p-text-image.yaml
run_flow 03-voice-note e2e/maestro/local/03-voice-note.yaml

kill "$RECORDER" "$LOGCAT" 2>/dev/null
adb shell pkill -INT screenrecord 2>/dev/null
sleep 3
mkdir -p "$OUT/recordings"
for f in $(adb shell ls /sdcard/ 2>/dev/null | tr -d '\r' | grep '^rec-'); do adb pull "/sdcard/$f" "$OUT/recordings/" >/dev/null 2>&1; done

echo "## app log access"
adb shell run-as io.twentysixty.mobileagent.dev ls files 2>&1 | head -3
adb root 2>&1 | tail -1
sleep 4
adb wait-for-device
adb shell ls -la /data/data/io.twentysixty.mobileagent.dev/files 2>&1 | head -30
adb shell find /data/data/io.twentysixty.mobileagent.dev -iname '*log*' 2>/dev/null | head -20
adb unroot >/dev/null 2>&1 || true
sleep 4
adb wait-for-device

adb install -r e2e-apks/dev-external.apk >/dev/null
run_flow x10-accredited-issuer e2e/maestro/external/x10-accredited-issuer.yaml

exit "$FAILED"
