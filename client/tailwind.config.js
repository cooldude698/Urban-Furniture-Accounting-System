/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design.md Section 2 — exact values, do not change
        'brown-900': '#4A3A34',
        'brown-700': '#77574A',
        'brown-500': '#A8836C',
        'brown-300': '#D0AE92',
        'brown-100': '#EBD7BE',
        cream: '#F9F2E4',
        surface: '#FFFFFF',
        posted: '#5F7052',
        'posted-bg': '#EDF1E8',
        warning: '#C08A3E',
        'warning-bg': '#FBF1DF',
        danger: '#9E4A38',
        'danger-bg': '#F8EAE6',
      },
      fontFamily: {
        display: ['Montserrat', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        // keep 'sans' alias for compatibility
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(74,58,52,.06)',
        md: '0 4px 12px rgba(74,58,52,.08)',
        lg: '0 12px 32px rgba(74,58,52,.12)',
      },
    },
  },
  plugins: [],
};
