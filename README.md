# Hologram App

This repository contains Hologram Mobile Agent, a React Native application used by end users to access different compatible Verifiable Services and connect to other DIDComm agents.

## Environment setup

Currently we are using [node 22.18.0](https://nodejs.org/dist/v22.18.0/). [pnpm](https://pnpm.io/) (pinned via the `packageManager` field in `package.json`) is used to manage packages and scripts. If you have [Corepack](https://nodejs.org/api/corepack.html) enabled, the correct pnpm version is activated automatically; otherwise run `corepack enable` once.

For Android, we are currently using the following toolchain:

- Android SDK 36
- Android NDK 27.1.12297006
- Gradle 8.14.3
- AGP 8.11.0
- JDK 21.0.7 (OpenJDK)
- Kotlin 2.1.20

For iOS:

- XCode 26.2 (17C52)
- CocoaPods 1.16.2

Import all dependencies by running:

```
pnpm install
```

For iOS, pods need to be installed:

```
cd ios
pod install
```

## Run in emulators or devices

The app can be run in both emulators/simulators and real devices. In parallel, a terminal running Metro server must be running:

```
pnpm start
```

For Android:

```
pnpm android
```

For iOS:

```
pnpm ios
```

Make sure to properly set-up your simulators in case of using them. You should probably open [XCode workspace](ios/hologram.xcworkspace/) to select a target matching the one in your system.
