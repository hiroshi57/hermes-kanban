/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f5f0ff',
          100: '#ede0ff',
          200: '#d8bfff',
          300: '#be93ff',
          400: '#aa3bff',
          500: '#9400ff',
          600: '#7a00d6',
          700: '#6000aa',
          800: '#480080',
          900: '#300055',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
