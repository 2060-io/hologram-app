const { mergeConfig } = require('@react-native/metro-config')
const { getDefaultConfig } = require('expo/metro-config')
/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'cjs', 'json'],
    extraNodeModules: { stream: require.resolve('readable-stream') },
  },
}

module.exports = mergeConfig(getDefaultConfig(__dirname), config)
