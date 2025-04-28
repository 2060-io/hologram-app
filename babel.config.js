module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    ['react-native-worklets-core/plugin'],
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    'babel-plugin-transform-typescript-metadata',
    [
      'module-resolver',
      {
        root: ['.'],
        alias: {
          // This has to be mirrored in tsconfig.json
          '^@2060/(.+)': './src/\\1',
          '@2060/local-native-modules': './modules/local-native-modules',
        },
      },
    ],
    [
      'react-native-reanimated/plugin',
      {
        globals: ['__scanCodes', '__scanFaces'],
      },
    ],
  ],
}
