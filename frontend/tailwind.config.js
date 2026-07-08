/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        path: {
          blue: '#0a66c2', // Corporate blue (like the 'your future' text)
          dark: '#0f172a', // Deep slate for footer/headers
          black: '#111111', // Almost black for text
          gray: '#f8fafc', // Very light gray for backgrounds
          border: '#e2e8f0', // Soft borders
        },

        // Accent palette used across the app (buttons, links, highlights).
        // Chosen for accessible contrast BOTH as text on white and as a
        // background under white text, since both patterns appear in the UI.
        neon: {
          cyan: '#0e7490',   // deep cyan — 5.1:1 on white, holds white text
          purple: '#7c3aed', // violet-600
          pink: '#db2777',   // pink-600
        },

        // The app is a LIGHT theme, but many components were written with
        // leftover `dark-*` utility names from an earlier dark theme. These are
        // only ever used for surfaces and borders (never text), so we map them
        // to light neutrals — this restores the intended borders/surfaces
        // instead of the classes silently producing no CSS.
        dark: {
          600: '#cbd5e1', // slate-300 — stronger border / hover
          605: '#cbd5e1',
          700: '#e2e8f0', // slate-200 — default subtle border
          750: '#e2e8f0',
          800: '#f1f5f9', // slate-100 — light surface / bars / chips
          850: '#f1f5f9',
          900: '#f8fafc', // slate-50 — page background / input surface
          950: '#f1f5f9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
