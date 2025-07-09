/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
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
        'sans': ['Inter', 'Noto Sans JP', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
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
  // 本番環境でのPurge無効化 - 全てのクラスを強制保持
  safelist: [
    // 基本カラー
    'bg-[#0D1117]',
    'bg-[#161B22]',
    'bg-[#21262D]',
    'bg-[#1E90FF]',
    'bg-dark-theme',
    'bg-sidebar',
    'bg-gray-700',
    'bg-gray-800',
    'bg-blue-600',
    'text-light-theme',
    'text-white',
    'text-gray-100',
    'text-gray-200',
    'text-gray-300',
    'text-gray-400',
    // レイアウト
    'flex',
    'flex-1',
    'flex-col',
    'h-screen',
    'h-full',
    'h-6',
    'w-full',
    'w-64',
    'w-6',
    'min-w-0',
    // スペーシング
    'p-2',
    'p-4',
    'px-4',
    'py-2',
    'mb-4',
    'ml-2',
    // ボーダー
    'border',
    'border-theme',
    'border-gray-600',
    'border-gray-700',
    'rounded',
    'rounded-lg',
    // ポジション
    'fixed',
    'relative',
    'absolute',
    'inset-0',
    'inset-y-0',
    'top-4',
    'left-4',
    'z-30',
    'z-40',
    'z-50',
    // トランスフォーム
    'translate-x-0',
    '-translate-x-full',
    'transition-transform',
    'transition-colors',
    'duration-300',
    'ease-in-out',
    // 表示
    'block',
    'hidden',
    'overflow-hidden',
    'overflow-y-auto',
    // ホバー
    'hover:bg-gray-700',
    'hover:bg-blue-700',
    // フォーカス
    'focus:outline-none',
    'focus:ring-2',
    // アニメーション
    'animate-spin',
    'animate-bounce',
    // レスポンシブ
    'md:hidden',
    'md:translate-x-0',
    'md:static',
    // その他
    'scrollbar-thin',
  ],
}