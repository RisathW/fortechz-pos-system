/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class', // Enables the manual theme toggle
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      // Fortechz design palette (Figma "POS System Web UI"): deep navy surfaces + vivid blue accent
      colors: {
        slate: {
          50: '#f7f8fc',
          100: '#eef0f7',
          200: '#e0e3ef',
          300: '#c3c6dc',
          400: '#9497b8',
          500: '#6b6e93',
          600: '#3a3c62',
          700: '#262848',
          800: '#1a1b36',
          900: '#13142b',
          950: '#0b0b19',
        },
        blue: {
          50: '#eef3ff',
          100: '#dbe6ff',
          200: '#bcd0ff',
          300: '#8eb0ff',
          400: '#5b8dff',
          500: '#3674ff',
          600: '#1d5ff5',
          700: '#174fd6',
          800: '#1a40a8',
          900: '#1a3478',
          950: '#141f45',
        },
      },
    }
  },
  plugins: [],
}
