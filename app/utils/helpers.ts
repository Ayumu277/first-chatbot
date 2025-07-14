/**
 * クラス名を条件に応じて結合するユーティリティ
 */
export const classNames = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}

/**
 * 日時フォーマット関数
 */
export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 相対時間表示（たった今、〜分前など）
 */
export const formatRelativeTime = (timestamp: string): string => {
  const now = new Date()
  const messageTime = new Date(timestamp)
  const diffMs = now.getTime() - messageTime.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'たった今'
  if (diffMinutes < 60) return `${diffMinutes}分前`
  if (diffHours < 24) return `${diffHours}時間前`
  if (diffDays < 7) return `${diffDays}日前`

  return formatTimestamp(timestamp)
}

/**
 * エラーメッセージの統一化
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '接続エラーが発生しました。ネットワーク接続を確認してください。',
  API_ERROR: 'サーバーエラーが発生しました。しばらく後にお試しください。',
  VALIDATION_ERROR: '入力内容に誤りがあります。確認してください。',
  GENERIC_ERROR: '予期しないエラーが発生しました。もう一度お試しください。'
} as const

/**
 * デバウンス関数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}