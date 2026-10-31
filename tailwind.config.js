/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fondo: '#F3F5F7',
        tinta: '#14202B',
        suave: '#566371',
        acento: '#1F5A9E',
        'acento-claro': '#E5EDF6',
        borde: '#E1E5E9',
        borde2: '#D9DEE3',
        peligro: '#9A2C20',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
