/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design.md Section 2 — CSS variable design token extensions
        brown: {
          50: 'var(--brown-50)',
          100: 'var(--brown-100)',
          200: 'var(--brown-200)',
          300: 'var(--brown-300)',
          400: 'var(--brown-400)',
          500: 'var(--brown-500)',
          600: 'var(--brown-600)',
          700: 'var(--brown-700)',
          800: 'var(--brown-800)',
          900: 'var(--brown-900)',
        },
        'brown-50': 'var(--brown-50)',
        'brown-100': 'var(--brown-100)',
        'brown-200': 'var(--brown-200)',
        'brown-300': 'var(--brown-300)',
        'brown-400': 'var(--brown-400)',
        'brown-500': 'var(--brown-500)',
        'brown-600': 'var(--brown-600)',
        'brown-700': 'var(--brown-700)',
        'brown-800': 'var(--brown-800)',
        'brown-900': 'var(--brown-900)',
        cream: 'var(--cream)',
        surface: 'var(--surface)',
        posted: 'var(--posted)',
        'posted-bg': 'var(--posted-bg)',
        warning: 'var(--warning)',
        'warning-bg': 'var(--warning-bg)',
        danger: 'var(--danger)',
        'danger-bg': 'var(--danger-bg)',
        info: 'var(--info)',
        draft: 'var(--draft)',
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
