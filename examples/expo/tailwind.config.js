const { hairlineWidth } = require('nativewind/theme');
const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}', './node_modules/@nayan-ui/react-native/dist/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    colors: {
      ...colors,
      primary: 'var(--color-primary)',
      card: 'var(--color-card)',
      text: 'var(--color-text)',
      muted: 'var(--color-muted)',
      border: 'var(--color-border)',
      background: 'var(--color-background)'
    },
    extend: {
      borderWidth: {
        hairline: hairlineWidth()
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: []
};
