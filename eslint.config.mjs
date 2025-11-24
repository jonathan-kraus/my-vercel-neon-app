import js from '@eslint/js';
import nextConfig from 'eslint-config-next';

// ESLint configuration updated to disable specific rules for problematic files

const config = [
  {
    ignores: [
      'postcss.config.js',
      'fixpost.js',
      'node_modules/**',
      '.next/**',
      '.vercel/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'app/generated/prisma/**',
      'coverage/**',
      'junit.xml',
      'generated/prisma/**',
    ],
  },
  ...nextConfig,
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'react/react-in-jsx-scope': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/rules-of-hooks': 'warn',
      'react-compiler/react-compiler': 'off',
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

export default config;
