/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          800: '#1e293b',
          850: '#162032',
          900: '#0f172a',
          950: '#090d16',
        },
        cyanGlow: '#06b6d4',
        emeraldGlow: '#10b981',
        violetGlow: '#8b5cf6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(99, 102, 241, 0.35)',
        cyanGlow: '0 0 25px -5px rgba(6, 182, 212, 0.35)',
        emeraldGlow: '0 0 25px -5px rgba(16, 185, 129, 0.35)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'radial-gradient': 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15), transparent 70%)',
        'radial-cyan': 'radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.12), transparent 50%)',
      },
    },
  },
  plugins: [],
};
