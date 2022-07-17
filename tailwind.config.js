module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'Helvetica', 'sans-serif'],
      },
    },
    screens: {
      'sm': '640px',
      'md': '768px'
    },
  },
  plugins: [],
}
