#!/usr/bin/env bash
set -uo pipefail
TAGS=${1:?usage: run-flows.sh <maestro tags> [shard index] [shard count]}
SHARD=${2:-0}
SHARDS=${3:-1}
OUT=$PWD/${E2E_OUT:-e2e-out}
APP_IDS="io.twentysixty.mobileagent.dev io.twentysixty.mobileagent.st"
# Outside /sdcard, where the media picker lists the recordings and a flow can attach one
REC_DIR=/data/local/tmp/e2e-rec
mkdir -p "$OUT/recordings" "$OUT/app-logs" "$OUT/junit" "$OUT/maestro"

TAG_RE="^tags:.*\\b($(tr ',' '|' <<<"$TAGS"))\\b"
FLOWS=()
i=0
while read -r flow; do
  ((i % SHARDS == SHARD)) && FLOWS+=("$flow")
  i=$((i + 1))
done < <(grep -lE "$TAG_RE" e2e/maestro/smoke/*.yaml e2e/maestro/local/*.yaml 2>/dev/null | grep -E "${FLOW_FILTER:-.}" | sort)
((i == 0)) && { echo "no flow has one of the tags $TAGS"; exit 1; }
echo "shard $SHARD of $SHARDS runs ${#FLOWS[@]} of $i flows"
printf '%s\n' "${FLOWS[@]}" | xargs -r -n1 basename -s .yaml >"$OUT/flows.txt"

node e2e/ci/adb-helper.mjs >"$OUT/adb-helper.log" 2>&1 &
HELPER=$!

# run-as fails because the e2e build type is not debuggable, and adb root restarts adbd, so do it once
adb root >/dev/null 2>&1
sleep 4
timeout 60 adb wait-for-device

adb logcat -c || true
adb logcat -v time >"$OUT/logcat.txt" 2>/dev/null &
LOGCAT=$!

CODE=0
for flow in "${FLOWS[@]}"; do
  name=$(basename "$flow" .yaml)
  adb shell "rm -rf $REC_DIR && mkdir -p $REC_DIR"
  (
    n=0
    while :; do
      adb shell screenrecord --bit-rate 2000000 "$REC_DIR/$name-$n.mp4" >/dev/null 2>&1 || sleep 2
      n=$((n + 1))
    done
  ) &
  RECORDER=$!

  timeout 900 maestro test --format junit --output "$OUT/junit/$name.xml" \
    --debug-output "$OUT/maestro/$name" --test-output-dir "$OUT/maestro/$name" --flatten-debug-output "$flow" || CODE=1

  kill "$RECORDER" 2>/dev/null
  adb shell pkill -INT screenrecord 2>/dev/null
  sleep 3
  mkdir -p "$OUT/recordings/$name" "$OUT/app-logs/$name"
  for f in $(adb shell ls "$REC_DIR" 2>/dev/null | tr -d '\r' | grep "^$name-"); do
    adb pull "$REC_DIR/$f" "$OUT/recordings/$name/" >/dev/null 2>&1 || echo "could not pull $f"
  done
  for pkg in $APP_IDS; do
    adb pull "/data/data/$pkg/files/hologramLogs" "$OUT/app-logs/$name/$pkg" >/dev/null 2>&1 || echo "no app logs for $pkg after $name"
    adb shell "rm -rf /data/data/$pkg/files/hologramLogs/*"
  done
done

kill "$LOGCAT" "$HELPER" 2>/dev/null
adb unroot >/dev/null 2>&1 || true
exit "$CODE"
