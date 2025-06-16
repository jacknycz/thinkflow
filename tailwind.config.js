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
          50: '#F3FFFF',
    100: '#CEECE8',
    200: '#A9DAD1',
    300: '#82C7BA',
    400: '#58B5A4',
    500: '#1CA28F',
    600: '#1C8371',
    700: '#196554',
    800: '#144838',
    900: '#0E2D1F',
    950: '#001500',
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
