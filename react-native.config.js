module.exports = {
  dependencies: {
    'react-native-fs': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
  project: {
    ios: {
      automaticPodsInstallation: false,
    },
    android: {},
  },
  assets: ['./src/assets/fonts'],
}
