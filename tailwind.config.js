/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      colors: {
        space: {
          bg:     '#000000',
          panel:  '#080810',
          accent: '#10102a',
          neon:   '#e94560',
          gold:   '#f5a623',
          green:  '#4ade80',
          star:   '#a78bfa',
        }
      }
    },
  },
  plugins: [],
}
