import js from '@eslint/js';
import nextConfig from 'eslint-config-next';
import parser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

const config = [
  {
    ignores: [
      'postcss.config.js',
      'fixpost.js',
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'app/generated/prisma/**',
    ],
  },
  ...nextConfig,
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'off',
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];

export { config };
