import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

import boundaries from 'eslint-plugin-boundaries';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettierConfig,
  {
    plugins: {boundaries, prettierPlugin},
    languageOptions: {
      parserOptions: {
        projectService: true,
        allowDefaultProject: [],
        tsconfigRootDir: import.meta.dirname,
        project: './tsconfig.json',
      },
    },
    rules: {
      ...boundaries.configs.strict.rules,
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-misused-promises': 'off',
      'boundaries/element-types': [
        2,
        {
          default: 'disallow',
          rules: [
            {
              from: 'routes',
              allow: ['config', 'utilities', 'controllers', 'schemas'],
            },
            {
              from: 'controllers',
              allow: ['config', 'utilities', 'db', 'services', 'schemas'],
            },
            {
              from: 'services',
              allow: ['config', 'utilities', 'db', 'schemas'],
            },
            {
              from: 'schemas',
              allow: ['db'],
            },
            {
              from: 'config',
              allow: ['db'],
            },
            {
              from: 'utilities',
              allow: ['schemas'],
            },
          ],
        },
      ],
    },
    settings: {
      'boundaries/ignore': ['src/index.ts', '**/*.spec.ts', '**/*.test.ts'],
      'boundaries/elements': [
        {
          type: 'config',
          pattern: 'src/config',
          mode: 'folder',
        },
        {
          type: 'controllers',
          pattern: 'src/controllers',
          mode: 'folder',
        },
        {
          type: 'db',
          pattern: 'src/db',
          mode: 'folder',
        },
        {
          type: 'routes',
          pattern: 'src/routes',
          mode: 'folder',
        },
        {
          type: 'schemas',
          pattern: 'src/schemas',
          mode: 'folder',
        },
        {
          type: 'services',
          pattern: 'src/services',
          mode: 'folder',
        },
        {
          type: 'utilities',
          pattern: 'src/utilities',
          mode: 'folder',
        },
        {
          type: 'tests',
          pattern: 'tests',
          mode: 'folder',
        },
      ],
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
  },
  {
    ignores: ['node_modules/**/*', 'dist/**/*', 'build/**/*', 'out', 'coverage', 'public', 'scripts', 'tools', 'temp', 'tmp', 'eslint.config.mjs', 'tsconfig.json', 'jest.config.js'],
  },
);
