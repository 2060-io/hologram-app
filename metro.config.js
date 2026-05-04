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

const merged = mergeConfig(getDefaultConfig(__dirname), config)

// Bypass Expo's automatic `react-native-vector-icons` -> `@expo/vector-icons`
// alias. The alias is installed by `@expo/cli` inside
// `withMetroMultiPlatform.js` AFTER our metro.config.js is loaded (see
// `instantiateMetro.js#loadMetroConfigAsync`), wrapping our `resolveRequest`
// in expo's chain. The aliased `@expo/vector-icons` pulls in `expo-font` ->
// `expo-asset`, whose native module is excluded from autolinking. In release
// builds this leads to:
//   "Cannot find native module 'ExpoAsset'"
// when any <Icon /> mounts (e.g. in ReactionMenu) because
// `Asset.downloadAsync` only short-circuits for HTTP-served (dev) assets.
//
// To bypass the alias we intercept the request and return a `sourceFile`
// resolution directly. Delegating via `context.resolveRequest` would re-enter
// expo's chain which would still rewrite the request.
const rnviRoot = path.dirname(require.resolve('react-native-vector-icons/package.json'))
merged.resolver.resolveRequest = (context, moduleName, platform) => {
  const match = /^react-native-vector-icons(?:\/(.+))?$/.exec(moduleName)
  if (match) {
    const sub = match[1]
    const target = sub ? path.join(rnviRoot, sub) : rnviRoot
    return { type: 'sourceFile', filePath: require.resolve(target) }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = merged
