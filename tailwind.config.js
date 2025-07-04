/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0D1117',
        'accent-blue': '#1E90FF',
        'gray-800': '#21262D',
        'gray-700': '#30363D',
        'gray-600': '#484F58',
        'gray-500': '#656D76',
        'gray-400': '#7D8590',
        'gray-300': '#9DAAB6',
        'gray-200': '#B1BAC4',
        'gray-100': '#C9D1D9',
        'gray-50': '#F0F6FC',
      },
      fontFamily: {
        'sans': ['var(--font-sans)'],
      },
      fontWeight: {
        'normal': '400',
        'medium': '500',
        'semibold': '600',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}