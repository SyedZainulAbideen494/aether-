/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#05070d',
        surface: '#0b0f1a',
        elevated: '#111626',
        inset: '#080b14',
        ink: '#f5f7fb',
        muted: '#9aa4bf',
        faint: '#5a637a',
        line: 'rgba(255,255,255,0.07)',
        'line-strong': 'rgba(255,255,255,0.14)',
        accent: {
          DEFAULT: '#7c5cff',
          soft: 'rgba(124,92,255,0.14)',
          strong: '#5a3bff',
          ink: '#ffffff',
        },
        violet: '#9b6bff',
        indigo: '#5b7cff',
        blue: '#4aa8ff',
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['SFMono-Regular', 'ui-monospace', 'Menlo', 'monospace'],
        display: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { '2xl': '1.125rem', '3xl': '1.5rem', '4xl': '2rem' },
      boxShadow: {
        card: '0 8px 40px -16px rgba(0,0,0,0.6)',
        float: '0 20px 60px -20px rgba(0,0,0,0.7)',
        glow: '0 0 40px -8px rgba(124,92,255,0.5)',
      },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.45' } },
        float: { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-6px)' } },
      },
      animation: {
        shimmer: 'shimmer 1.8s linear infinite',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
