/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['index.html', 'src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef3ff',
          100: '#d9e5ff',
          200: '#b7cdff',
          300: '#89adff',
          400: '#5d8dff',
          500: '#376fff',
          600: '#2256e3',
          700: '#1a44b6',
          800: '#163a90',
          900: '#142f73',
        },
      },
    },
  },
  plugins: [],
};