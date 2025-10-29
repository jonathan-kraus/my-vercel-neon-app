import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
// import tailwindcss from 'eslint-plugin-tailwindcss';

// const tailwindPath = require.resolve('tailwindcss');

export default [
  {
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
ignores: [
  '**/node_modules/**',
  '**/.next/**',
  '**/.next/**/*',
  '**/.next/**/static/**',
  '**/.next/**/static/chunks/**',
  '**/.next/**/server/**',
  '**/.next/**/server/chunks/**',
  '**/dist/**',
  '**/build/**',
  '**/public/**',
  '**/coverage/**',
  '**/app/generated/**',
],
    languageOptions: {
      parser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': plugin,

      react,
      'react-hooks': reactHooks,
      // tailwindcss, ← disable for now due to plugin crash
    },
    settings: {
      // tailwindcss: {
      //   config: './tailwind.config.ts',
      // },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      // 'tailwindcss/classnames-order': 'warn',
      // 'tailwindcss/no-custom-classname': 'off',
    },
  },
];
