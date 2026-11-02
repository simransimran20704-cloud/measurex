/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#4385E8',
          violet: '#8064E8',
          purple: '#F0EDFF',
          dark: '#1D2940',
          muted: '#66758D',
          bg: '#F8FAFF',
          bgSecondary: '#EEF3FF',
          grid: '#DCE5F2',
          success: '#16A078',
          warning: '#E6A23C',
          cyan: '#36C6DA'
        }
      },
      boxShadow: {
        'aurora': '0 12px 36px -8px rgba(67, 133, 232, 0.18)',
        'aurora-glow': '0 0 25px rgba(128, 100, 232, 0.25)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-hover': '0 14px 40px 0 rgba(31, 38, 135, 0.12)',
        'card-subtle': '0 4px 20px -2px rgba(67, 133, 232, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
