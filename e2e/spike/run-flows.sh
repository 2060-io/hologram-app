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

pull_app_logs() {
  local name=$1
  shift
  adb root >/dev/null 2>&1
  sleep 4
  adb wait-for-device
  mkdir -p "$OUT/$name"
  for pkg in "$@"; do
    adb pull "/data/data/$pkg/files/hologramLogs" "$OUT/$name/app-logs-$pkg" >/dev/null 2>&1 || echo "no app logs for $pkg"
  done
  adb unroot >/dev/null 2>&1 || true
  sleep 4
  adb wait-for-device
}

pull_app_logs 03-voice-note io.twentysixty.mobileagent.dev io.twentysixty.mobileagent.st

adb install -r e2e-apks/dev-external.apk >/dev/null
# Both flavors handle didcomm://, so with two apps openLink stops at the Android "Open with" sheet
adb uninstall io.twentysixty.mobileagent.st >/dev/null
run_flow x10-accredited-issuer e2e/maestro/external/x10-accredited-issuer.yaml
pull_app_logs x10-accredited-issuer io.twentysixty.mobileagent.dev
curl -fsS -m 20 https://demo-chatbot-backend.demos.dev.hologram.zone/health | tee "$OUT/chatbot-health.json" || echo "dev chatbot health check failed"
run_flow x01-dev-chatbot e2e/maestro/external/x01-dev-chatbot.yaml
pull_app_logs x01-dev-chatbot io.twentysixty.mobileagent.dev

exit "$FAILED"
