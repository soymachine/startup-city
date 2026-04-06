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
          bg:     '#05050f',
          panel:  '#0a0a1e',
          accent: '#15153a',
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
