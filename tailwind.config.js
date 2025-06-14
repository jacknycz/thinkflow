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
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
};

console.log('Tailwind CSS configuration loaded successfully.');
