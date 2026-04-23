const { fixupPluginRules, fixupConfigRules } = require('@eslint/compat')
const { FlatCompat } = require('@eslint/eslintrc')
const js = require('@eslint/js')
const typescriptEslintPlugin = require('@typescript-eslint/eslint-plugin')
const tsParser = require('@typescript-eslint/parser')
const { defineConfig } = require('eslint/config')
const importPlugin = require('eslint-plugin-import')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

module.exports = defineConfig([
  {
    ignores: ['node_modules', 'dist', 'build', '.expo'],
  },
  {
    languageOptions: {
      parser: tsParser,
      sourceType: 'module',
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
      globals: {
        fetch: false,
        __DEV__: true,
        require: true,
      },
    },
    plugins: {
      import: fixupPluginRules(importPlugin),
      '@typescript-eslint': fixupPluginRules(typescriptEslintPlugin),
    },
    extends: fixupConfigRules(
      compat.extends(
        '@react-native',
        'plugin:prettier/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'plugin:@typescript-eslint/recommended',
      ),
    ),
    settings: {
      'import/ignore': ['node_modules/'],
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
      'max-len': [
        'error',
        {
          code: 110,
          ignoreStrings: true,
        },
      ],
      'import/no-named-as-default': 0,
      'import/no-cycle': ['error', { ignoreExternal: true }],
      'import/newline-after-import': [
        'error',
        {
          count: 1,
        },
      ],
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
      'object-curly-newline': [
        'error',
        {
          ObjectPattern: {
            multiline: true,
            minProperties: 7,
          },
        },
      ],
      'react/require-default-props': 'off',
      'react/jsx-props-no-spreading': 'off',
      'no-param-reassign': [
        'error',
        {
          props: false,
        },
      ],
      'no-underscore-dangle': [
        'error',
        {
          allow: ['_store', '_id'],
        },
      ],
      'no-unused-expressions': [
        2,
        {
          allowShortCircuit: true,
          allowTernary: true,
        },
      ],
      'no-plusplus': 'off',
      'one-var': [
        2,
        {
          uninitialized: 'always',
        },
      ],
      'one-var-declaration-per-line': [2, 'initializations'],
      'react-hooks/exhaustive-deps': 'off',
      /* This is a rule that disables the eslint rule for unlimited disable. */
      'eslint-comments/no-unlimited-disable': 'off',
      'react-native/no-inline-styles': 'error',
      'linebreak-style': 0,
      'prettier/prettier': [
        'error',
        {
          'no-inline-styles': false,
        },
      ],
    },
  },
  {
    files: ['scripts/**/*.{ts,js}', 'brand/**/*.js'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['*.config.js', 'metro.config.js', 'eslint.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
])
