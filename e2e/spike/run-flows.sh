#!/usr/bin/env bash
set -uo pipefail
OUT=${E2E_OUT:-e2e-out}
mkdir -p "$OUT/shots"
adb shell monkey -p io.twentysixty.mobileagent.dev -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
sleep 25
adb exec-out screencap -p > "$OUT/shots/dev-first-launch.png"
adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 && adb pull /sdcard/ui.xml "$OUT/shots/dev-first-launch.xml" >/dev/null
adb logcat -d | grep -iE 'ReactNativeJS|FATAL|AndroidRuntime' | tail -40
exit 0
