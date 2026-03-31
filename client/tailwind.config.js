/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        game: {
          bg:      '#0f172a',
          surface: '#1e293b',
          border:  '#334155',
          accent:  '#6366f1',
          success: '#22c55e',
          danger:  '#ef4444',
        }
      },
      fontFamily: {
        game: ['"Press Start 2P"', 'monospace']
      }
    }
  },
  plugins: []
}