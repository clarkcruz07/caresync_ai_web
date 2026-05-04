/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2fbff',
          100: '#dff6ff',
          200: '#b9edff',
          300: '#7fddff',
          400: '#3cc7f5',
          500: '#1aa9dd',
          600: '#1188bb',
          700: '#126d97',
          800: '#145a7b',
          900: '#144a66'
        },
        ink: {
          900: '#0b1220',
          700: '#1f2a3a',
          500: '#415066',
          300: '#7b879a'
        },
        surface: {
          0: '#ffffff',
          50: '#f8fafc',
          100: '#f1f5f9'
        }
      },
      boxShadow: {
        card: '0 12px 28px -14px rgba(15, 23, 42, 0.25), 0 8px 16px -12px rgba(15, 23, 42, 0.18)',
        soft: '0 10px 22px -14px rgba(15, 23, 42, 0.20)'
      },
      borderRadius: {
        xl: '14px'
      }
    },
  },
  plugins: [],
}

