module.exports = {
  project: {
    ios: {
      automaticPodsInstallation: false,
    },
    android: {},
  },
  dependencies: {
    'react-native-compressor': {
      platforms: {
        ios: null,
      },
    },
  },
  assets: ['./src/assets/fonts'],
}
