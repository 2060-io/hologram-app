module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'import'],
  extends: [
    '@react-native',
    'plugin:prettier/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  settings: {
    'import/ignore': ['node_modules/react-native/index\\.js$'],
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
  rules: {
    curly: ['error', 'multi-line'],
    '@typescript-eslint/no-explicit-any': 'error',
    'no-unused-labels': 'off',
    'no-use-before-define': 'off',
    'react/jsx-filename-extension': 'off',
    'react/prop-types': 'off',
    'comma-dangle': 'off',
    'no-console': 'error',
    'max-len': ['error', { code: 110, ignoreStrings: true }],
    'import/no-named-as-default': 0,
    'import/no-cycle': 'error',
    'import/newline-after-import': ['error', { count: 1 }],
    'import/order': [
      'error',
      {
        groups: ['type', ['builtin', 'external'], 'parent', 'sibling', 'index'],
        alphabetize: {
          order: 'asc',
        },
        'newlines-between': 'always',
      },
    ],
    'react/no-unstable-nested-components': [
      'warn',
      {
        allowAsProps: true,
      },
    ],
    'object-curly-newline': ['error', { ObjectPattern: { multiline: true, minProperties: 7 } }],
    'react/require-default-props': 'off',
    'react/jsx-props-no-spreading': 'off',
    'no-param-reassign': ['error', { props: false }],
    'no-underscore-dangle': ['error', { allow: ['_store', '_id'] }],
    'no-unused-expressions': [2, { allowShortCircuit: true, allowTernary: true }],
    'no-plusplus': 'off',
    'one-var': [2, { uninitialized: 'always' }],
    'one-var-declaration-per-line': [2, 'initializations'],
    'react-hooks/exhaustive-deps': 'off',
    /* This is a rule that disables the eslint rule for unlimited disable. */
    'eslint-comments/no-unlimited-disable': 'off',
    'react-native/no-inline-styles': 0,
    'linebreak-style': 0,
    'prettier/prettier': [
      'error',
      {
        'no-inline-styles': false,
      },
    ],
  },
  overrides: [
    {
      files: ['scripts/**'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
  globals: {
    fetch: false,
    __DEV__: true,
    require: true,
  },
}
