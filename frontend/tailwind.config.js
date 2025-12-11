/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#121212',
        card: '#1C1C1C',
        accent: '#E64242',
        chatBubble: '#F5F5F5',
        secondary: '#A7A7A7',
        borderSubtle: 'rgba(255,255,255,0.12)',
      },
    },
  },
  plugins: [],
}
