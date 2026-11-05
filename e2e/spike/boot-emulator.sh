#!/usr/bin/env bash
set -uo pipefail
API=34
IMG="system-images;android-$API;google_apis;x86_64"
AVD=hologram_e2e
SDK=${ANDROID_HOME:?ANDROID_HOME is not set}
export PATH="$SDK/cmdline-tools/latest/bin:$SDK/emulator:$SDK/platform-tools:$PATH"
# GitHub runners set XDG_CONFIG_HOME, so avdmanager writes under ~/.config while the emulator reads ~/.android
export ANDROID_AVD_HOME="$HOME/.android/avd"
mkdir -p "$ANDROID_AVD_HOME"
OUT=${E2E_OUT:-e2e-out}
mkdir -p "$OUT"

start_emulator() {
  nohup emulator -avd "$AVD" -no-window -no-boot-anim -accel on -gpu swiftshader_indirect \
    -dns-server "${DNS_BIND_IP:?DNS_BIND_IP is not set}" -allow-host-audio "$@" >>"$OUT/emulator.log" 2>&1 &
}

wait_boot() {
  local start=$SECONDS
  if ! timeout 300 adb wait-for-device; then
    echo "no adb device after 300 s" >&2
    tail -40 "$OUT/emulator.log" >&2
    exit 1
  fi
  until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
    if [ $((SECONDS - start)) -gt 600 ]; then
      echo "emulator did not boot in 600 s" >&2
      tail -40 "$OUT/emulator.log" >&2
      exit 1
    fi
    sleep 2
  done
  echo "boot_completed after $((SECONDS - start)) s"
}

if [ ! -d "$ANDROID_AVD_HOME/$AVD.avd" ]; then
  echo "AVD cache miss: creating $AVD"
  SECONDS=0
  yes 2>/dev/null | sdkmanager --licenses >/dev/null
  sdkmanager --install emulator "$IMG" >/dev/null || exit 1
  echo "sdk install took $SECONDS s"
  echo no | avdmanager create avd -n "$AVD" -k "$IMG" -d pixel_6 --force || exit 1
  cat >>"$ANDROID_AVD_HOME/$AVD.avd/config.ini" <<CFG || exit 1
hw.ramSize=4096
disk.dataPartition.size=6G
hw.keyboard=yes
hw.audioInput=yes
hw.audioOutput=yes
CFG
  echo "cold boot to build the snapshot"
  start_emulator -no-snapshot-load
  wait_boot
  sleep 30
  adb emu kill
  until ! pgrep -f "qemu-system-x86_64" >/dev/null; do sleep 2; done
fi

echo "snapshot boot"
start_emulator -no-snapshot-save
wait_boot
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
adb shell settings put secure show_ime_with_hard_keyboard 0
