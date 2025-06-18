/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'wave-left': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(-20deg)' },
        },
        'wave-right': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(20deg)' },
        },
      },
      animation: {
        'blink': 'blink 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'wave-left': 'wave-left 2s ease-in-out infinite',
        'wave-right': 'wave-right 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} 