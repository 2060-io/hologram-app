# E2E tests

Black-box tests with [Maestro](https://maestro.dev). See [the test plan](../doc/E2ETestPlan.md).

## Run on a laptop (Android)

You need an emulator with API 34 (`google_apis`), Maestro 2.12.1 and JDK 17.

```sh
ENVFILE=.env.e2e-local ./android/gradlew -p android assembleDevE2e assembleStagingE2e -PreactNativeArchitectures=x86_64
adb install -r android/app/build/outputs/apk/dev/e2e/app-dev-e2e.apk
adb install -r android/app/build/outputs/apk/staging/e2e/app-staging-e2e.apk
adb shell locksettings set-pin 1234
maestro test --include-tags smoke e2e/maestro
```

The flows type the PIN `1234` at the screen lock prompt.

## Layout

- `maestro/smoke`: checks that the two apps open. It needs no backend.
- `maestro/subflows`: shared steps. `APP_ID`, `NAME`, `LINK` and `APP_LABEL` are their parameters.
- `maestro/fixtures`: media for the flows. `SHA256SUMS` has their hashes. Maestro only reads media inside the directory that it runs, so they are under `maestro`.
- `ci`: scripts for the CI job in `.github/workflows/e2e-android.yml`.

## The `e2e` build type

It is a release build with debug signing that also trusts the test CA in
`android/app/src/e2e`, only for `hologram.test`. The prod flavor has no `e2e` variant, and the CI
job checks that a release build has no test CA.
