/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#faf9f6', // Warm Linen Paper (Main BG)
          800: '#ffffff', // Pure White (Card BG)
          700: '#e8e6e1', // Warm Gray (Card Border)
          600: '#d0cbc2', // Border Active / Hover
        },
        neon: {
          cyan: '#166534', // Forest Green (Primary)
          purple: '#be123c', // Rose Red (Secondary)
          pink: '#d97706', // Amber Gold (Accent)
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'glow-purple': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.25)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        'glass': '16px',
      },
    },
  },
  plugins: [],
}
