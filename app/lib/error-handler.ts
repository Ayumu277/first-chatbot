// エラーハンドリングのユーティリティ関数

export interface APIError {
  message: string
  code?: string
  details?: string
  status?: number
}

export class AppError extends Error {
  public readonly code?: string
  public readonly details?: string
  public readonly status?: number

  constructor(message: string, code?: string, details?: string, status?: number) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
    this.status = status
  }
}

// Prismaエラーの処理
export function handlePrismaError(error: any): APIError {
  console.error('Prisma error:', error)

  if (error.code === 'P2002') {
    return {
      message: 'このデータは既に存在します',
      code: 'DUPLICATE_ENTRY',
      status: 409
    }
  }

  if (error.code === 'P2025') {
    return {
      message: 'データが見つかりません',
      code: 'NOT_FOUND',
      status: 404
    }
  }

  if (error.code === 'P2003') {
    return {
      message: '関連するデータが見つかりません',
      code: 'FOREIGN_KEY_CONSTRAINT',
      status: 400
    }
  }

  if (error.code === 'P1001') {
    return {
      message: 'データベースに接続できません',
      code: 'DATABASE_CONNECTION_ERROR',
      status: 503
    }
  }

  return {
    message: 'データベースエラーが発生しました',
    code: 'DATABASE_ERROR',
    details: error.message,
    status: 500
  }
}

// APIエラーの処理
export function handleAPIError(error: any): APIError {
  console.error('API error:', error)

  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      details: error.details,
      status: error.status
    }
  }

  if (error.name === 'ValidationError') {
    return {
      message: '入力データが無効です',
      code: 'VALIDATION_ERROR',
      details: error.message,
      status: 400
    }
  }

  if (error.name === 'TypeError') {
    return {
      message: '処理中にエラーが発生しました',
      code: 'TYPE_ERROR',
      details: error.message,
      status: 500
    }
  }

  return {
    message: error.message || '予期しないエラーが発生しました',
    code: 'UNKNOWN_ERROR',
    details: error.stack,
    status: 500
  }
}

// レスポンス用のエラーフォーマット
export function formatErrorResponse(error: APIError) {
  return {
    error: error.message,
    code: error.code,
    details: process.env.NODE_ENV === 'development' ? error.details : undefined,
    timestamp: new Date().toISOString()
  }
}

// 共通のエラーハンドリング関数
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args)
    } catch (error) {
      const apiError = handleAPIError(error)
      throw new AppError(apiError.message, apiError.code, apiError.details, apiError.status)
    }
  }
}

// フロントエンド用のエラーハンドリング
export function handleClientError(error: any): string {
  if (error.response) {
    // HTTPエラーレスポンス
    const status = error.response.status
    const data = error.response.data

    if (status === 400) {
      return data.error || '入力データが無効です'
    }
    if (status === 401) {
      return 'ログインが必要です'
    }
    if (status === 403) {
      return 'アクセス権限がありません'
    }
    if (status === 404) {
      return 'データが見つかりません'
    }
    if (status === 409) {
      return 'データが既に存在します'
    }
    if (status === 429) {
      return 'リクエストが多すぎます。しばらく待ってから再試行してください'
    }
    if (status >= 500) {
      return 'サーバーエラーが発生しました。しばらく待ってから再試行してください'
    }

    return data.error || `エラーが発生しました (${status})`
  }

  if (error.request) {
    // ネットワークエラー
    return 'ネットワークエラーが発生しました。接続を確認してください'
  }

  // その他のエラー
  return error.message || '予期しないエラーが発生しました'
}

// ログ記録用のエラーハンドリング
export function logError(error: any, context?: string) {
  const timestamp = new Date().toISOString()
  const errorInfo = {
    timestamp,
    context,
    message: error.message,
    stack: error.stack,
    code: error.code,
    status: error.status
  }

  console.error('Error logged:', errorInfo)

  // 本番環境では外部ログサービスに送信することも可能
  if (process.env.NODE_ENV === 'production') {
    // 例: Sentry, LogRocket, CloudWatch Logs等
    // sendToLoggingService(errorInfo)
  }
}