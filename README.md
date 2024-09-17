# 2060-mobile-agent

This repository contains 2060 Mobile Agent (Hologram), a React Native application used by end users to access different services provided by 2060 network and connect to other DIDComm agents.

## Environment setup

Currently we are using [node 20.11.1](https://nodejs.org/dist/v20.11.1/). [Yarn 3.0](https://yarnpkg.com/blog/release/3.0/) 3.6.4 or newer is used to manage packages and scripts.

For Android, we are currently using the following toolchain:

- Android SDK 34
- Android NDK 26.1.10909125
- JDK 17

For iOS:

- XCode 15.1
- CocoaPods 1.15.2

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

Make sure to properly set-up your simulators in case of using them. You should probably open [XCode workspace](ios/app2060.xcworkspace/) to select a target matching the one in your system.
