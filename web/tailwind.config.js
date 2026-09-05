/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brown: {
          900: '#4A3A34',
          700: '#77574A',
          500: '#A8836C',
          300: '#D0AE92',
          100: '#EBD7BE',
        },
        cream: '#F9F2E4',
        surface: '#FFFFFF',
        posted: {
          DEFAULT: '#5F7052',
          bg: '#EDF1E8',
        },
        warning: {
          DEFAULT: '#C08A3E',
          bg: '#FBF1DF',
        },
        danger: {
          DEFAULT: '#9E4A38',
          bg: '#F8EAE6',
        },
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
