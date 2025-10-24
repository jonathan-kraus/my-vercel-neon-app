// eslint.config.mjs
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import next from 'eslint-plugin-next';

export default [
  js.configs.recommended,
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
    plugins: {
      next,
      react,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off', // Not needed in Next.js
      // Add more rules here
    },
  },
];
