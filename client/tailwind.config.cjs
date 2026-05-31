/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
      extend: {
          colors: {
              "on-secondary-fixed": "#2a2420",
              "primary": "#c2652a",
              "on-secondary-fixed-variant": "#504840",
              "surface-variant": "#ece6dc",
              "secondary-container": "#eae2da",
              "secondary-fixed": "#eae2da",
              "on-surface-variant": "#605850",
              "surface-container-low": "#f6f0e8",
              "primary-container": "#e08850",
              "secondary": "#78706a",
              "on-secondary": "#ffffff",
              "surface-container-highest": "#e6e0d6",
              "on-secondary-container": "#605850",
              "outline-variant": "#d8d0c8",
              "on-tertiary-fixed": "#2e1515",
              "surface-tint": "#c2652a",
              "on-background": "#3a302a",
              "error-container": "#fce4e0",
              "tertiary": "#8c3c3c",
              "on-primary-fixed-variant": "#8a4518",
              "on-primary": "#ffffff",
              "on-error-container": "#7a1a10",
              "on-surface": "#3a302a",
              "inverse-primary": "#f0a878",
              "inverse-on-surface": "#faf5ee",
              "surface-container": "#f2ece4",
              "background": "#faf5ee",
              "tertiary-container": "#d47070",
              "on-tertiary-container": "#3a2020",
              "on-primary-container": "#fbe8d8",
              "on-error": "#ffffff",
              "secondary-fixed-dim": "#cec6be",
              "tertiary-fixed-dim": "#e8a0a0",
              "on-tertiary": "#ffffff",
              "surface-dim": "#dcd6cc",
              "surface-container-high": "#ece6dc",
              "surface": "#faf5ee",
              "on-primary-fixed": "#401a08",
              "surface-bright": "#faf5ee",
              "primary-fixed-dim": "#f0a878",
              "outline": "#9a9088",
              "primary-fixed": "#fbe8d8",
              "error": "#c0392b",
              "inverse-surface": "#3a302a",
              "surface-container-lowest": "#ffffff",
              "tertiary-fixed": "#fce0e0",
              "on-tertiary-fixed-variant": "#6e3030"
          },
          borderRadius: {
              "DEFAULT": "0.25rem",
              "lg": "0.5rem",
              "xl": "0.75rem",
              "full": "9999px"
          },
          fontFamily: {
              "headline": ["EB Garamond", "serif"],
              "display": ["EB Garamond", "serif"],
              "body": ["Manrope", "sans-serif"],
              "label": ["Manrope", "sans-serif"]
          },
          boxShadow: {
              'soft': '0 2px 16px rgba(58, 48, 42, 0.04)',
          },
          keyframes: {
              softPulse: {
                  '0%, 100%': { transform: 'scale(1)', opacity: '1', boxShadow: '0 0 0 0 rgba(194, 101, 42, 0.4)' },
                  '50%': { transform: 'scale(1.02)', opacity: '0.9', boxShadow: '0 0 0 12px rgba(194, 101, 42, 0)' },
              },
              floatSlow: {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-10px)' },
              }
          },
          animation: {
              'soft-pulse': 'softPulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              'float-slow': 'floatSlow 6s ease-in-out infinite',
          }
      }
  },
  plugins: [],
}
