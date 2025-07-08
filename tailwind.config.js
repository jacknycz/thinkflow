/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/pres-start-core/dist/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // <-- add this line
  theme: {
    extend: {
      colors: {
        p: {
          50: '#FFFFFF',
          100: '#FEDEEF',
          200: '#FBBCDE',
          300: '#F79ACE',
          400: '#F075BE',
          500: '#E84AAE',
          600: '#C3398E',
          700: '#9F296F',
          800: '#7D1A51',
          900: '#5C0B35',
          950: '#3D001C',
        },
        // ThinkFlow-inspired theme
        thinkFlow: {
          bg: '#101828', // main background
          panel: '#1A2233', // sidebar/panel
          card: '#232B3A', // node/card
          border: '#232B3A', // border/line
          accent: '#6D5DFB', // primary accent (blue-purple)
          accent2: '#A66CFA', // secondary accent (purple)
          text: '#FFFFFF', // main text
          textSecondary: '#B6C2E2', // secondary text
          edge: '#5B8DEF', // edge/line
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
      gradientColorStops: theme => ({
        ...theme('colors'),
        'thinkFlow-gradient': 'linear-gradient(90deg, #6D5DFB 0%, #A66CFA 100%)',
      }),
    },
  },
  plugins: [],
};

console.log('Tailwind CSS configuration loaded successfully.');
