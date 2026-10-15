/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        uptpc: {
          blue: '#0B4D94',
          'blue-dark': '#073262',
          'blue-light': '#1E6BB8',
          accent: '#0284C7',
          gold: '#F59E0B',
          surface: '#F8FAFC',
        },
      },
    },
  },
  plugins: [],
}

