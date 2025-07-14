'use client'

import { useSession, signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useChatStore } from '../store/chat-store'
import { UserIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const {
    currentUser,
    isGuest,
    setUser,
    setGuest,
    loadSessions
  } = useChatStore()

  useEffect(() => {
    const initializeUser = async () => {

      if (status === 'loading') {
        return
      }

      setIsLoading(true)

      // URLパラメータをチェック
      const urlParams = new URLSearchParams(window.location.search)
      const successParam = urlParams.get('success')
      const errorParam = urlParams.get('error')

      // URLパラメータをチェック
      const verifiedParam = urlParams.get('verified')
      const detailsParam = urlParams.get('details')

      if (successParam === 'registration_complete' || verifiedParam === 'true') {
        const emailParam = urlParams.get('email')
        if (verifiedParam === 'true') {
          setMessage(`✅ メール認証が完了しました！${emailParam ? `(${emailParam})` : ''} ログインしてください。`)
        } else {
          setMessage('✅ アカウント作成が完了しました！ログインしてください。')
        }
        // URLからパラメータを削除
        window.history.replaceState({}, '', window.location.pathname)
      } else if (errorParam) {
        const errorMessages: { [key: string]: string } = {
          'invalid_token': '❌ 無効な認証トークンです。再度登録をお試しください。',
          'expired_token': '❌ 認証トークンの期限が切れています。再度登録をお試しください。',
          'already_used': '❌ この認証トークンは既に使用済みです。',
          'user_exists': '❌ このメールアドレスは既に登録されています。',
          'verification_failed': '❌ メール認証に失敗しました。'
        }
        let errorMessage = errorMessages[errorParam] || '❌ エラーが発生しました。'
        if (detailsParam) {
          errorMessage += ` (詳細: ${decodeURIComponent(detailsParam)})`
        }
        setError(errorMessage)
        // URLからパラメータを削除
        window.history.replaceState({}, '', window.location.pathname)
      }

      if (session?.user) {
        // 認証されたユーザー
        const authenticatedUser = {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          isGuest: false
        }
        setUser(authenticatedUser)
        setGuest(false)

        try {
          await loadSessions()
        } catch (error) {
          console.error('❌ AuthWrapper: Failed to load sessions', error)
        }
      } else {

        // ゲストトークンが存在する場合、ゲストユーザーを復元
        const guestToken = localStorage.getItem('guestToken')
        if (guestToken) {

          // 固定の共通ゲストトークンをチェック
          if (guestToken === 'shared_guest_token') {
            try {
              // 共通ゲストユーザーを取得
              const response = await fetch('/api/users/guest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              })

              if (response.ok) {
                const result = await response.json()
                if (result.success && result.user) {
                  setUser(result.user)
                  setGuest(true)

                  // セッションをロード
                  try {
                    await loadSessions()

                    // セッション読み込み後、最新のセッションがあれば選択
                    const currentStore = useChatStore.getState()
                    if (currentStore.sessions.length > 0 && !currentStore.currentSessionId) {
                      const latestSession = currentStore.sessions[0]
                      useChatStore.getState().selectSession(latestSession.id)
                    }
                  } catch (error) {
                    console.error('❌ AuthWrapper: Failed to load guest sessions', error)
                  }
                } else {
                  localStorage.removeItem('guestToken')
                }
              } else {
                localStorage.removeItem('guestToken')
              }
            } catch (error) {
              console.error('❌ AuthWrapper: Error restoring guest user:', error)
              localStorage.removeItem('guestToken')
            }
          } else {
            // 古いトークンの場合は削除
            localStorage.removeItem('guestToken')
          }
        } else {
        }
      }

      setIsLoading(false)
    }

    initializeUser()
  }, [session, status])

  const handleGuestMode = async () => {
    try {
      setIsLoading(true)

      // 固定の共通ゲストトークン
      const SHARED_GUEST_TOKEN = 'shared_guest_token'

      // 共通ゲストユーザーを作成または取得
      const response = await fetch('/api/users/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })


      const result = await response.json()

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error || 'Unknown error'}`)
      }

      if (!result.success) {
        throw new Error(result.error || 'ゲストユーザーの作成に失敗しました')
      }

      const guestUser = result.user

      // 固定トークンをローカルストレージに保存
      localStorage.setItem('guestToken', SHARED_GUEST_TOKEN)

      // ゲストユーザーの状態を設定
      setUser(guestUser)
      setGuest(true)

      // セッションをロード
      try {
        await loadSessions()

        // セッション読み込み後、最新のセッションがあれば選択
        const currentStore = useChatStore.getState()
        if (currentStore.sessions.length > 0 && !currentStore.currentSessionId) {
          const latestSession = currentStore.sessions[0]
          useChatStore.getState().selectSession(latestSession.id)
        }
      } catch (sessionError) {
        console.warn('セッション読み込みエラー（続行します）:', sessionError)
        // セッション読み込みエラーは無視してアプリを開始
      }

      setIsLoading(false)
    } catch (error) {
      console.error('Failed to create guest user:', error)
      setIsLoading(false)

      // より詳細なエラーメッセージを表示
      let errorMessage = 'ゲストユーザーでの開始に失敗しました。'
      if (error instanceof Error) {
        errorMessage += `\n詳細: ${error.message}`
      }
      errorMessage += '\n\nページを再読み込みして、もう一度お試しください。'

      alert(errorMessage)
    }
  }

  // ローディング中
  if (isLoading || status === 'loading') {
    return (
      <div className="flex h-screen bg-[#0D1117] text-white items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-[#1E90FF] mx-auto mb-6"></div>
          <p className="text-gray-300 font-semibold text-lg">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 認証されているかゲストモードの場合はアプリを表示
  if (session?.user || (isGuest && currentUser)) {
    return <>{children}</>
  }

  // ログイン画面
  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0D1117] to-[#1a0b2e] text-white relative overflow-hidden">
      {/* 背景の装飾エフェクト */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-20">
            {/* 近未来的なロゴ */}
            <div className="relative inline-block mb-12">
              <div className="w-32 h-32 bg-gradient-to-tr from-[#00d4ff] via-[#1E90FF] to-[#0099ff] rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/50 border border-blue-400/30 backdrop-blur-sm">
                <UserIcon className="w-16 h-16 text-white filter drop-shadow-lg" />
              </div>
              {/* グローエフェクト */}
              <div className="absolute inset-0 w-32 h-32 bg-gradient-to-tr from-blue-400 to-cyan-400 rounded-2xl blur-md opacity-20 animate-pulse mx-auto"></div>
            </div>

            <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] via-[#1E90FF] to-[#0099ff] mb-8 tracking-wider">
              CHATBOT
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-transparent via-blue-400 to-transparent mx-auto mb-8"></div>
          </div>

          {/* メッセージ表示 */}
          {message && (
            <div className="mb-8 p-6 bg-green-900/40 border border-green-400/50 rounded-xl text-green-200 backdrop-blur-sm">
              {message}
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="mb-8 p-6 bg-red-900/40 border border-red-400/50 rounded-xl text-red-200 backdrop-blur-sm">
              {error}
            </div>
          )}

          <div className="space-y-8">
            {/* メインゲストボタン - 近未来的デザイン */}
            <button
              onClick={handleGuestMode}
              className="group relative w-full overflow-hidden"
            >
              {/* ボタンのベース */}
              <div className="relative flex items-center justify-center gap-6 px-16 py-20 bg-gradient-to-r from-[#0066ff] via-[#1E90FF] to-[#00aaff] rounded-xl transition-all duration-500 font-bold text-3xl shadow-2xl shadow-blue-500/40 transform group-hover:scale-[1.02] group-hover:shadow-blue-500/60">

                {/* アニメーション背景 */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* 光るボーダー */}
                <div className="absolute inset-0 rounded-xl border-2 border-blue-400/50 group-hover:border-cyan-400/80 transition-all duration-500"></div>

                {/* コンテンツ */}
                <div className="relative z-10 flex items-center gap-6">
                  <div className="relative">
                    <GlobeAltIcon className="w-12 h-12 text-white filter drop-shadow-lg" />
                    <div className="absolute inset-0 w-12 h-12 bg-white/20 rounded-full blur-md group-hover:blur-lg transition-all duration-500"></div>
                  </div>
                  <span className="text-white tracking-wide">ゲストとして始める</span>
                </div>

                {/* パーティクル効果 */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </div>
            </button>

            {/* Googleログインボタン（準備中） - 近未来スタイル */}
            <button
              disabled
              className="relative w-full overflow-hidden"
            >
              <div className="relative flex items-center justify-center gap-6 px-16 py-16 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-xl font-bold text-xl shadow-xl cursor-not-allowed border border-gray-600/50">
                <UserIcon className="w-10 h-10 text-gray-400" />
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 tracking-wide">Googleでログイン</span>
                  <span className="text-sm bg-gray-900/80 px-4 py-2 rounded-lg font-medium text-gray-300 border border-gray-600/50">
                    準備中
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}