// @ts-check
const path = require('node:path');
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const stylistic = require('@stylistic/eslint-plugin');
const importPlugin = require('eslint-plugin-import');
const vitestPlugin = require('@vitest/eslint-plugin');
const { getInvalidImportsRule } = require('./.eslint-custom-rules');

// One block per library/app project: the tsconfig(s) used for type-aware linting and the
// "no-restricted-imports" arguments (own project name, whether OpenLayers imports are
// allowed, whether admin imports are allowed) that used to live in projects/*/.eslintrc.js.
const projects = [
  { dir: 'projects/app', tsconfigs: ['tsconfig.app.json', 'tsconfig.spec.json'], importsRuleArgs: ['@tailormap-viewer/app'] },
  { dir: 'projects/core', tsconfigs: ['tsconfig.lib.json', 'tsconfig.spec.json'], importsRuleArgs: ['@tailormap-viewer/core'] },
  { dir: 'projects/api', tsconfigs: ['tsconfig.lib.json', 'tsconfig.spec.json'], importsRuleArgs: ['@tailormap-viewer/api'] },
  { dir: 'projects/shared', tsconfigs: ['tsconfig.lib.json', 'tsconfig.spec.json'], importsRuleArgs: ['@tailormap-viewer/shared'] },
  { dir: 'projects/map', tsconfigs: ['tsconfig.lib.json', 'tsconfig.spec.json'], importsRuleArgs: ['@tailormap-viewer/map', true] },
  { dir: 'projects/admin-core', tsconfigs: ['tsconfig.lib.json', 'tsconfig.spec.json'], importsRuleArgs: ['@tailormap-admin/admin-core', false, true] },
  { dir: 'projects/admin-api', tsconfigs: ['tsconfig.lib.json', 'tsconfig.spec.json'], importsRuleArgs: ['@tailormap-admin/admin-api', false, true] },
];

module.exports = tseslint.config(
  {
    // The generated environment files are excluded from linting entirely, same as the old
    // "**/environment*.ts" ignorePattern in projects/app/.eslintrc.js.
    ignores: [
      'projects/app/**/environment*.ts',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    plugins: {
      import: importPlugin,
      '@stylistic': stylistic,
    },
    languageOptions: {
      globals: {
        $localize: 'readonly',
      },
    },
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'tm',
          style: 'kebab-case',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'tm',
          style: 'camelCase',
        },
      ],
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'explicit',
          overrides: {
            constructors: 'off',
          },
        },
      ],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          caughtErrors: 'none',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'arrow-parens': ['off', 'always'],
      'comma-dangle': 'off',
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      'no-underscore-dangle': 'off',
      'import/no-default-export': 'error',
      'import/order': 'off',
      'arrow-body-style': 'off',
      semi: 'off',
      '@stylistic/semi': 'error',
      '@stylistic/member-ordering': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE'],
        },
        {
          selector: ['objectLiteralProperty', 'classProperty'],
          format: ['camelCase', 'UPPER_CASE', 'snake_case'],
          leadingUnderscore: 'allowSingleOrDouble',
        },
      ],
      'space-before-function-paren': 'off',
      '@stylistic/space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          named: 'ignore',
          asyncArrow: 'always',
        },
      ],
      '@angular-eslint/prefer-standalone': 'off',
      'object-curly-spacing': ['error', 'always'],
      'no-array-constructor': ['error'],
      'array-bracket-spacing': [
        'error',
        'always',
        {
          arraysInArrays: false,
          objectsInArrays: false,
          singleValue: false,
        },
      ],
      'comma-spacing': [
        'error',
        {
          before: false,
          after: true,
        },
      ],
      'max-len': ['error', 180],
      '@stylistic/member-delimiter-style': [
        'error',
        {
          multiline: {
            delimiter: 'semi',
            requireLast: true,
          },
          singleline: {
            delimiter: 'semi',
            requireLast: false,
          },
        },
      ],
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.mock.ts'],
    plugins: {
      '@vitest': vitestPlugin,
    },
    languageOptions: {
      globals: vitestPlugin.environments.env.globals,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@vitest/prefer-importing-vitest-globals': 'error',
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
    ],
    rules: {},
  },
  // Per-project overrides: type-aware parserOptions.project + the "no-restricted-imports"
  // rule that prevents circular/forbidden imports between the workspace's libraries.
  ...projects.map(({ dir, tsconfigs, importsRuleArgs }) => ({
    files: [`${dir}/**/*.ts`],
    languageOptions: {
      parserOptions: {
        project: tsconfigs,
        tsconfigRootDir: path.join(__dirname, dir),
      },
    },
    rules: {
      'no-restricted-imports': ['error', getInvalidImportsRule(...importsRuleArgs)],
    },
  })),
);
