/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // INI HARUS ADA
  ],
  theme: {
    extend: {
      colors: {
        'app-bg': '#D1D1D1', // Ini warna yang lu mau
      }
    },
  },
  plugins: [],
}