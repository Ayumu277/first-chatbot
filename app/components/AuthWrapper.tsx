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
    createGuestUser,
    setGuest,
    loadSessions
  } = useChatStore()

  useEffect(() => {
    const initializeUser = async () => {
      console.log('🔧 AuthWrapper: initializeUser called', { status, session })

      if (status === 'loading') {
        console.log('⏳ AuthWrapper: Still loading...')
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
        console.log('✅ AuthWrapper: User session found', session.user)
        // 認証されたユーザー
        const authenticatedUser = {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          isGuest: false
        }
        console.log('👤 AuthWrapper: Setting authenticated user', authenticatedUser)
        setUser(authenticatedUser)
        setGuest(false)

        console.log('📚 AuthWrapper: Loading sessions for user', authenticatedUser.id)
        try {
          await loadSessions()
          console.log('✅ AuthWrapper: Sessions loaded successfully')
        } catch (error) {
          console.error('❌ AuthWrapper: Failed to load sessions', error)
        }
      } else {
        console.log('❌ AuthWrapper: No user session found')
        // 認証されていない場合は何もしない（ログイン画面を表示）
      }

      setIsLoading(false)
      console.log('🔧 AuthWrapper: initializeUser completed')
    }

    initializeUser()
  }, [session, status])

  const handleGuestMode = async () => {
    try {
      console.log('ゲストモードボタンがクリックされました')
      setIsLoading(true)
      console.log('ゲストユーザーを作成中...')
      const guestUser = await createGuestUser()
      console.log('ゲストユーザーが作成されました:', guestUser)
      localStorage.setItem('guestToken', guestUser.guestToken!)
      console.log('ゲストトークンをローカルストレージに保存しました')

      // ゲストユーザーの状態を明示的に設定
      setUser(guestUser)
      setGuest(true)

      // セッションをロード
      await loadSessions()

      setIsLoading(false)
      console.log('ゲストユーザーのセットアップが完了しました')
    } catch (error) {
      console.error('Failed to create guest user:', error)
      alert('ゲストユーザーの作成に失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'))
      setIsLoading(false)
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
    <div className="flex h-screen bg-[#0D1117] text-white">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="text-center mb-16">
            <div className="w-24 h-24 bg-[#1E90FF] rounded-xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <UserIcon className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-black text-white mb-6">
              chatbot
            </h1>
            <p className="text-gray-300 text-xl font-bold">
              AIチャットを始めましょう
            </p>
          </div>

          {/* メッセージ表示 */}
          {message && (
            <div className="mb-8 p-4 bg-green-900 border border-green-600 rounded-lg text-green-200">
              {message}
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="mb-8 p-4 bg-red-900 border border-red-600 rounded-lg text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-8">
            {/* ゲストモードボタン */}
            <button
              onClick={handleGuestMode}
              className="w-full flex items-center justify-center gap-6 px-12 py-16 bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] hover:from-[#1873CC] hover:to-[#0099CC] text-white rounded-lg transition-all duration-300 font-bold text-2xl shadow-2xl hover:shadow-blue-500/30 transform hover:scale-[1.02] hover:-translate-y-2"
            >
              <GlobeAltIcon className="w-10 h-10" />
              ゲストとして始める
            </button>

            {/* Googleログインボタン（準備中） */}
            <button
              disabled
              className="w-full flex items-center justify-center gap-6 px-12 py-12 bg-gradient-to-r from-gray-700 to-gray-800 text-gray-500 rounded-lg font-bold text-xl shadow-xl cursor-not-allowed opacity-60"
            >
              <UserIcon className="w-8 h-8" />
              <div className="flex items-center gap-3">
                <span>Googleでログイン</span>
                <span className="text-sm bg-gray-900 px-3 py-1 rounded-md font-medium">準備中</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}