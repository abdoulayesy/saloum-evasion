import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      '.lighthouseci/**',
      'next-env.d.ts',
      'src/payload-types.ts',
      'src/app/(payload)/admin/importMap.js',
      'src/migrations/**',
      '.specify/**',
      '.claude/**',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'plugin:jsx-a11y/recommended'),
  {
    rules: {
      // Constitution VII : TypeScript strict, aucun any.
      '@typescript-eslint/no-explicit-any': 'error',
      // Pas d'assertion de type `as` (les `as const` restent autorisées).
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
];

export default config;
