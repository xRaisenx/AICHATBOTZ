// tailwind.config.ts
import type { Config } from 'tailwindcss';
// Import default theme using require for CommonJS compatibility in config
const defaultTheme = require('tailwindcss/defaultTheme');

// Define the configuration object
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './providers/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Use the CSS variable and fallbacks
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: 'var(--primary)',
        'primary-dark': 'var(--primary-dark)',
        'bg-light': 'var(--bg-light)',
        'bg-dark': 'var(--bg-dark)',
        'card-bg-light': 'var(--card-bg-light)',
        'card-bg-dark': 'var(--card-bg-dark)',
        'input-bg-light': 'var(--input-bg-light)',
        'input-bg-dark': 'var(--input-bg-dark)',
        'bubble-user-bg': 'var(--bubble-user-bg)',
        'bubble-bot-bg': 'var(--bubble-bot-bg)',
        'bubble-bot-bg-dark': 'var(--bubble-bot-bg-dark)',
        'advice-bg-light': 'var(--advice-bg-light)',
        'advice-bg-dark': 'var(--advice-bg-dark)',
        'text-light': 'var(--text-light)',
        'text-dark': 'var(--text-dark)',
        'advice-text-light': 'var(--advice-text-light)',
        'advice-text-dark': 'var(--advice-text-dark)',
        'match-reason-light': 'var(--match-reason-color-light)',
        'match-reason-dark': 'var(--match-reason-color-dark)',
        'border-light': 'var(--border-light)',
        'border-dark': 'var(--border-dark)',
        'advice-border-light': 'var(--advice-border-light)',
        'advice-border-dark': 'var(--advice-border-dark)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      keyframes: {
         bounce: {
           '0%, 100%': { transform: 'translateY(0)' },
           '50%': { transform: 'translateY(-4px)' },
         },
       },
       animation: {
         bounce: 'bounce 0.6s infinite ease-in-out',
       },
       typography: ({ theme }: { theme: any }) => ({
         DEFAULT: {
           css: {
             '--tw-prose-body': theme('colors.text-light'),
             '--tw-prose-headings': theme('colors.text-light'),
             '--tw-prose-bold': theme('colors.text-light'),
             '--tw-prose-invert-body': theme('colors.text-dark'),
             '--tw-prose-invert-headings': theme('colors.text-dark'),
             '--tw-prose-invert-bold': theme('colors.text-dark'),
             a: {
                color: theme('colors.primary'),
                '&:hover': {
                  color: theme('colors.primary-dark'),
                },
              },
             // Add styles for lists within prose if needed
             'ul > li::marker': { // Example: Change marker color
                color: theme('colors.primary'),
             },
             'ol > li::marker': {
                color: theme('colors.primary'),
             },
             '--tw-prose-invert-ul > li::marker': { // Dark mode markers
                color: theme('colors.primary'),
             },
             '--tw-prose-invert-ol > li::marker': {
                color: theme('colors.primary'),
             },
           },
         },
       }),
    },
  },
  plugins: [
      require('@tailwindcss/typography'),
  ],
};

// Use module.exports for compatibility
module.exports = config;