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
          900: '#2E2218',
          800: '#433224',
          700: '#5A4535',
          600: '#735844',
          500: '#8B6D53',
          400: '#A98C72',
          300: '#C7AD96',
          200: '#E0CEBD',
          100: '#F5EFEA',
          50: '#FAF7F2',
        },
        cream: '#FAF7F2',
        surface: '#FFFFFF',
        success: '#2E7D32',
        'success-bg': '#E8F5E9',
        warning: '#ED6C02',
        'warning-bg': '#FFF4E5',
        danger: '#D32F2F',
        'danger-bg': '#FFEBEE',
      },
      fontFamily: {
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
