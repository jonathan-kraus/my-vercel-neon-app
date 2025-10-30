import type { Config } from 'tailwindcss';

const config: Config = {
  content: {
    files: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  },
  theme: {
    extend: {
      // your customizations
    },
  },
  plugins: [],
};

export default config;
