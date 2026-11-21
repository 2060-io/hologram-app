#!/usr/bin/env bash
set -uo pipefail
TAGS=${1:?usage: run-flows.sh <maestro tags> [shard index] [shard count]}
SHARD=${2:-0}
SHARDS=${3:-1}
OUT=${E2E_OUT:-e2e-out}
[[ $OUT = /* ]] || OUT=$PWD/$OUT
APP_IDS="io.twentysixty.mobileagent.dev io.twentysixty.mobileagent.st"
# Outside /sdcard, where the media picker lists the recordings and a flow can attach one
REC_DIR=/data/local/tmp/e2e-rec
mkdir -p "$OUT/recordings" "$OUT/app-logs" "$OUT/junit" "$OUT/maestro"

flow_tags() {
  awk '/^---/ { exit }
    /^tags:/ { sub(/^tags:[ \t]*/, ""); gsub(/[][,]/, " "); print; list = 1; next }
    list && /^[ \t]*- / { sub(/^[ \t]*- /, ""); print; next }
    { list = 0 }' "$1" | tr -s ' \t' '\n'
}

TAGGED=()
KNOWN=()
FOUND=" "
for flow in e2e/maestro/*/*.yaml; do
  [[ $flow == */subflows/* ]] && continue
  tags=" $(flow_tags "$flow" | tr '\n' ' ') "
  match=
  for tag in $tags; do
    [[ ",$TAGS," == *",$tag,"* ]] && match=1 && FOUND+="$tag "
  done
  [[ -z $match ]] && continue
  if [[ $tags == *" known-issue "* && ",$TAGS," != *",known-issue,"* ]]; then
    KNOWN+=("$(basename "$flow" .yaml)")
  else
    TAGGED+=("$flow")
  fi
done
for tag in ${TAGS//,/ }; do
  [[ $FOUND == *" $tag "* ]] || { echo "no flow has the tag $tag"; exit 1; }
done

FLOWS=()
i=0
while read -r flow; do
  ((i % SHARDS == SHARD)) && FLOWS+=("$flow")
  i=$((i + 1))
done < <(printf '%s\n' "${TAGGED[@]}" | grep -E "${FLOW_FILTER:-.}" | sort)
((i == 0)) && { echo "no flow with the tags $TAGS matches ${FLOW_FILTER:-.}"; exit 1; }
if ((SHARD == 0 && ${#KNOWN[@]} > 0)); then
  printf '%s\n' "${KNOWN[@]}" | tee "$OUT/known-issues.txt" | sed 's/^/skipped: known issue /'
fi

SKIPPED_SERVICES=$OUT/skipped-services.txt
if [[ -f $SKIPPED_SERVICES ]]; then
  : >"$OUT/skipped.txt"
  RUNNABLE=()
  for flow in "${FLOWS[@]}"; do
    down=$(sed '/^---/q' "$flow" | grep -oE '\bsvc-[a-z0-9-]+' | cut -c5- | sort -u | grep -xFf "$SKIPPED_SERVICES" | paste -sd, -)
    if [[ -n $down ]]; then
      echo "$(basename "$flow" .yaml) $down" | tee -a "$OUT/skipped.txt" | sed 's/^/skipped: infra /'
    else
      RUNNABLE+=("$flow")
    fi
  done
  FLOWS=("${RUNNABLE[@]}")
fi
echo "shard $SHARD of $SHARDS runs ${#FLOWS[@]} of $i flows"
printf '%s\n' "${FLOWS[@]}" | xargs -r -n1 basename -s .yaml >"$OUT/flows.txt"

RUN_ID=${RUN_ID:-${GITHUB_RUN_ID:+gh-$GITHUB_RUN_ID-${GITHUB_RUN_ATTEMPT:-1}}}
MAESTRO_ENV=(-e "RUN_ID=${RUN_ID:-local-$(date +%Y%m%d%H%M%S)}")
while read -r pair; do
  MAESTRO_ENV+=(-e "$pair")
done < <(node -p 'Object.entries(require("./e2e/services.json").env).map(([k, v]) => k + "=" + v).join("\n")')

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

  timeout 900 maestro test "${MAESTRO_ENV[@]}" --format junit --output "$OUT/junit/$name.xml" \
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
