import { type Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.145 0 0)',
        border: 'oklch(0.922 0 0)',
        ring: 'oklch(0.708 0 0)',
        // Add more tokens as needed
      },
    },
  },
  plugins: [animate],
};

export default config;
