/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/
import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import headerPlugin from 'eslint-plugin-header'
import globals from 'globals'

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  // 0) Ignore generated + infra + specific files
  {
    ignores: [
      'build/**',
      'dist/**',
      'coverage/**',
      '.yarn/**',
      'node_modules/**',
      'eslint.config.js',

      // explicitly excluded
      'scripts/check-license.mjs',
      'server.js',
    ],
  },

  // 1) Base JS
  js.configs.recommended,

  // 2) App code (browser + React + TS). No project parsing to avoid noise.
  {
    files: ['app/**/*.{js,jsx,ts,tsx}', 'app/**'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      header: headerPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: false,
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        React: 'readonly',
        JSX: 'readonly',
        process: 'readonly',
      },
    },
    settings: {
      react: { version: 'detect' },
      formComponents: ['Form'],
      linkComponents: [
        { name: 'Link', linkAttribute: 'to' },
        { name: 'NavLink', linkAttribute: 'to' },
      ],
      'import/internal-regex': '^~/',
      'import/resolver': {
        node: { extensions: ['.ts', '.tsx', '.js', '.jsx'] },
        typescript: { alwaysTryTypes: true },
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,

      ...importPlugin.configs.recommended.rules,
      ...importPlugin.configs.typescript.rules,

      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      'jsx-a11y/anchor-has-content': 'off',

      // Core rules can misfire on TS types like RequestInit/BodyInit
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },

  // 2b) Generic TS override
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },

  // 3) Node scripts / configs (excluding ignored ones)
  {
    files: [
      'scripts/**/*.js',
      'scripts/**/*.cjs',
      'jest.config.cjs',
      'postcss.config.js',
      'tailwind.config.ts',
      '.eslintrc.cjs',
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: false },
      globals: { ...globals.node },
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // 4) Tests (Jest globals)
  {
    files: ['**/*.test.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: { ...globals.jest },
    },
  },
]
