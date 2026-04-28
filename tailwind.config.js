/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['IBM Plex Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        bg: '#0a0a0a',
        surface: '#111111',
        border: '#1e1e1e',
        amber: { DEFAULT: '#f59e0b', dim: '#78450a' },
        muted: '#3a3a3a',
        text: { DEFAULT: '#e8e8e8', muted: '#666' },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
