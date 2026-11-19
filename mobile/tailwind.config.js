/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        slabDark: '#0B0F19',
        slabCard: '#111827',
        slabEmerald: '#10B981',
        slabCrimson: '#EF4444'
      }
    }
  },
  plugins: []
};
