/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        github: {
          bg: '#0f1419',
          surface: '#161b22',
          border: '#30363d',
          muted: '#8b949e',
          text: '#e6edf3',
          accent: '#3fb950',
          'accent-hover': '#56d364',
          error: '#f85149',
        }
      }
    },
  },
  plugins: [],
}
