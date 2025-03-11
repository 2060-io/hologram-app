# 2060-mobile-agent

This repository contains 2060 Mobile Agent (Hologram), a React Native application used by end users to access different services provided by 2060 network and connect to other DIDComm agents.

## Environment setup

Currently we are using [node 20.11.1](https://nodejs.org/dist/v20.11.1/). [Yarn 1.22.22](https://classic.yarnpkg.com/lang/en/) is used to manage packages and scripts.

For Android, we are currently using the following toolchain:

- Android SDK 35
- Android NDK 26.1.10909125
- JDK 17
- Kotlin 1.9.24

For iOS:

- XCode 16.2
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
