// テーマ色の定義
export const THEME_COLORS = {
  // ベース色
  background: {
    primary: '#0D1117',
    secondary: '#161B22',
    tertiary: '#1C2128'
  },

  // テキスト色
  text: {
    primary: '#FFFFFF',
    secondary: '#C9D1D9',
    muted: '#8B949E',
    accent: '#58A6FF'
  },

  // ボーダー色
  border: {
    primary: '#30363D',
    secondary: '#21262D',
    focus: '#1E90FF'
  },

  // 状態色
  state: {
    hover: '#21262D',
    active: '#1E90FF',
    success: '#238636',
    error: '#DA3633',
    warning: '#D29922'
  }
} as const

// スペーシング定数
export const SPACING = {
  header: 'p-4',
  message: 'space-y-4',
  container: 'px-4 py-6',
  footer: 'p-4',
  bottomPadding: 'pb-16'
} as const

// サイズ定数
export const SIZES = {
  sidebar: 'w-64',
  minInputHeight: 'min-h-[48px]',
  maxInputHeight: 'max-h-32',
  iconButton: 'h-4 w-4',
  avatar: 'w-8 h-8'
} as const