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
        city: {
          bg: '#1a1a2e',
          panel: '#16213e',
          accent: '#0f3460',
          neon: '#e94560',
          gold: '#f5a623',
          green: '#4ade80',
        }
      }
    },
  },
  plugins: [],
}
