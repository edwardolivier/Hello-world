/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        electric: {
          50: '#eff6ff',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        }
      }
    }
  },
  plugins: []
}
