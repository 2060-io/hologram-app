module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    '@babel/plugin-transform-class-static-block',
    'babel-plugin-transform-typescript-metadata',
    [
      'module-resolver',
      {
        root: ['.'],
        alias: {
          // This has to be mirrored in tsconfig.json
          '^@src/(.+)': './src/\\1',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
}
