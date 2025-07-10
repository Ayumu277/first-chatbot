module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // 本番環境でもcssnanoを無効化してTailwindCSSのスタイルを保持
    ...(process.env.NODE_ENV === 'production' && process.env.DISABLE_CSSNANO !== 'true' ? {} : {}),
  },
}