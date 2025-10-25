// eslint.config.mjs
import js from '@eslint/js';
import nextConfig from 'eslint-config-next';

export default [
  ...nextConfig, // Next.js rules (includes React and TypeScript support)
  js.configs.recommended, // Base JS rules
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'app/generated/prisma/**',
    ],
    languageOptions: {
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off', // Not needed in Next.js
    },
  },
];
    