/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          900: '#0b0d12',
          800: '#12151c',
          700: '#1a1e27',
          600: '#262b37',
          500: '#3a4150',
          400: '#6b7385',
          300: '#9aa1b2',
          200: '#cdd2dd',
          100: '#e8eaf0',
        },
      },
    },
  },
  plugins: [],
};
