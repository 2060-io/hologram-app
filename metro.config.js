const { mergeConfig } = require('@react-native/metro-config')
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const emptyShim = path.resolve(__dirname, 'shims', 'empty.js')
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
    // Ensure Metro prefers browser-compatible entrypoints where available.
    // This prevents Node-only modules (eg `require('https')`) from being pulled
    // into the React Native bundle when a package provides a `browser` mapping.
    // Note: we prefer `main` over `module` because some packages publish an
    // incorrect `module` path (eg missing dist ESM builds), which Metro treats
    // as the "main module field".
    resolverMainFields: ['react-native', 'browser', 'main', 'module'],
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'cjs', 'mjs', 'json'],
    extraNodeModules: {
      stream: require.resolve('readable-stream'),
      crypto: require.resolve('isomorphic-webcrypto'),
      https: emptyShim,
      http: emptyShim,
      url: emptyShim,
      util: emptyShim,
      '@digitalcredentials/open-badges-context': require.resolve(
        '@digitalcredentials/open-badges-context/js/index.js',
      ),
    },
  },
}

module.exports = mergeConfig(getDefaultConfig(__dirname), config)
