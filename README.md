# Hologram App

This repository contains Hologram Mobile Agent, a React Native application used by end users to access different compatible Verifiable Services and connect to other DIDComm agents.

## Environment setup

Currently we are using [node 22.18.0](https://nodejs.org/dist/v22.18.0/). [Yarn 1.22.22](https://classic.yarnpkg.com/lang/en/) is used to manage packages and scripts.

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
yarn install
```

For iOS, pods need to be installed:

```
cd ios
pod install
```

## Run in emulators or devices

The app can be run in both emulators/simulators and real devices. In parallel, a terminal running Metro server must be running:

```
yarn start
```

For Android:

```
yarn run android
```

For iOS:

```
yarn run ios
```

Make sure to properly set-up your simulators in case of using them. You should probably open [XCode workspace](ios/hologram.xcworkspace/) to select a target matching the one in your system.
