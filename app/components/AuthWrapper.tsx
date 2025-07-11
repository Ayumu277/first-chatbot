'use client'

import { useSession, signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useChatStore } from '../store/chat-store'
import { UserIcon, GlobeAltIcon, UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [showSignUpForm, setShowSignUpForm] = useState(false)
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    useGoogleAccount: false
  })
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

  const handleLogin = () => {
    signIn('google', {
      prompt: 'select_account'
    })
  }

  const handleSignUpFormOpen = () => {
    setShowSignUpForm(true)
  }

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (signUpData.useGoogleAccount) {
      // Googleアカウントでサインアップ
      signIn('google', {
        prompt: 'consent select_account',
        callbackUrl: '/?signup=true'
      })
    } else {
      // 独自のアカウント作成処理（将来的に実装）
      alert('独自アカウント作成は今後実装予定です。現在はGoogleアカウントをご利用ください。')
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
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-[#1E90FF] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <UserIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-black text-white mb-4">
              chatbot
            </h1>
            <p className="text-gray-300 text-lg font-medium">
              ログインまたはゲストモードでチャットを始めましょう
            </p>
          </div>

          <div className="space-y-5">
            {/* ゲストモードボタン */}
            <button
              onClick={handleGuestMode}
              className="w-full flex items-center justify-center gap-4 px-8 py-5 bg-[#1E90FF] hover:bg-blue-600 text-white rounded-xl transition-all duration-300 font-black text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <GlobeAltIcon className="w-6 h-6" />
              ゲストとして始める
            </button>

            {/* Googleログインボタン */}
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-4 px-8 py-5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-300 font-black text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <UserIcon className="w-6 h-6" />
              Googleでログイン
            </button>

            {/* サインアップボタン */}
            <button
              onClick={handleSignUpFormOpen}
              className="w-full flex items-center justify-center gap-4 px-8 py-5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all duration-300 font-black text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <UserPlusIcon className="w-6 h-6" />
              新規アカウント作成
            </button>
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-400 font-medium">
              ゲストモードでは、データはブラウザに一時的に保存されます<br />
              ログイン・サインアップでは、チャット履歴が永続保存されます
            </p>
          </div>
        </div>
      </div>

      {/* サインアップフォームモーダル */}
      {showSignUpForm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E1E1E] rounded-xl p-8 max-w-md w-full border border-gray-600">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-white">新規アカウント作成</h3>
              <button
                onClick={() => setShowSignUpForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSignUpSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  お名前
                </label>
                <input
                  type="text"
                  value={signUpData.name}
                  onChange={(e) => setSignUpData({...signUpData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="田中太郎"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={signUpData.email}
                  onChange={(e) => setSignUpData({...signUpData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-[#2A2A2A] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="example@gmail.com"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useGoogleAccount"
                  checked={signUpData.useGoogleAccount}
                  onChange={(e) => setSignUpData({...signUpData, useGoogleAccount: e.target.checked})}
                  className="mr-3 w-4 h-4 text-blue-600 bg-[#2A2A2A] border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="useGoogleAccount" className="text-sm text-gray-300">
                  Googleアカウントでサインアップ
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSignUpForm(false)}
                  className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                >
                  アカウント作成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}