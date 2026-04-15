/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans:    ['"Source Sans 3"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        guinda: {
          950: '#2D0614',
          900: '#4A0E22',
          800: '#6B1530',
          700: '#8B1538',
          600: '#A01C42',
          500: '#B8244E',
          400: '#C93D63',
          300: '#D96B88',
          200: '#E9A0B2',
          100: '#F5D5DC',
          50:  '#FDF0F3',
        },
        dorado: {
          DEFAULT: '#C9A84C',
          dark:    '#A8873A',
          light:   '#DFC070',
          pale:    '#F5E9C8',
        },
        crema: {
          DEFAULT: '#FAF7F2',
          dark:    '#F0EAE0',
          border:  '#E2D8CC',
        },
        success: {
          DEFAULT: '#166534',
          light:   '#16A34A',
          bg:      '#F0FDF4',
          border:  '#BBF7D0',
        },
        warning: {
          DEFAULT: '#92400E',
          light:   '#D97706',
          bg:      '#FFFBEB',
          border:  '#FDE68A',
        },
        danger: {
          DEFAULT: '#991B1B',
          light:   '#DC2626',
          bg:      '#FEF2F2',
          border:  '#FECACA',
        },
      },
      animation: {
        'fade-in':   'fadeIn 0.4s ease-out',
        'slide-up':  'slideUp 0.35s ease-out',
        'slide-in':  'slideIn 0.3s ease-out',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'scan-line': 'scanLine 1.8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:  { '0%': { transform: 'translateY(16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideIn:  { '0%': { transform: 'translateX(-8px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        pulseDot: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
        scanLine: { '0%, 100%': { transform: 'translateY(0)', opacity: '0.5' }, '50%': { transform: 'translateY(48px)', opacity: '1' } },
      },
      boxShadow: {
        'card':      '0 1px 4px rgba(139,21,56,0.06), 0 4px 16px rgba(139,21,56,0.04)',
        'card-hover':'0 4px 16px rgba(139,21,56,0.12), 0 8px 32px rgba(139,21,56,0.08)',
        'modal':     '0 20px 60px rgba(45,6,20,0.25)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};