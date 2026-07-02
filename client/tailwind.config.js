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
      },
      boxShadow: {
        'pixel-primary':     '3px 0px 0 #3730a3, 0px 3px 0 #3730a3, 3px 3px 0 #3730a3, 6px 0px 0 #1e1b4b, 0px 6px 0 #1e1b4b, 6px 6px 0 #1e1b4b',
        'pixel-secondary':   '3px 0px 0 #0f172a, 0px 3px 0 #0f172a, 3px 3px 0 #0f172a, 6px 0px 0 #000, 0px 6px 0 #000, 6px 6px 0 #000',
        'pixel-card':        '0 0 0 2px #0f172a, 0 0 0 4px #334155, 0 0 0 6px #0f172a, 6px 6px 0 #000',
        'pixel-input':       'inset 3px 3px 0 #000, inset -3px -3px 0 #334155, 3px 3px 0 #000',
        'pixel-input-focus': 'inset 3px 3px 0 #000, inset -3px -3px 0 #6366f1, 3px 3px 0 #000',
      },
      fontSize: {
        'pixel-xs': ['0.4rem',  { lineHeight: '1.6' }],
        'pixel-sm': ['0.55rem', { lineHeight: '1.6' }],
        'pixel-md': ['0.6rem',  { lineHeight: '1.6' }],
        'pixel-lg': ['0.85rem', { lineHeight: '1.6' }],
        'pixel-xl': ['1rem',    { lineHeight: '1.4' }],
      }
    }
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.text-shadow-pixel': {
          'text-shadow': '1px 0px 0 currentColor, 0px 1px 0 currentColor, 1px 1px 0 currentColor',
        },
        '.text-shadow-pixel-glow': {
          'text-shadow': '0 0 10px currentColor, 0 0 20px currentColor, 1px 1px 0 currentColor',
        },
        '.text-shadow-accent-glow': {
          'text-shadow': '0 0 15px rgba(99,102,241,0.8), 0 0 30px rgba(99,102,241,0.4)',
        },
      })
    }
  ]
}