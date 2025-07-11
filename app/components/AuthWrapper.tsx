'use client'

import { useSession, signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useChatStore } from '../store/chat-store'
import { UserIcon, GlobeAltIcon, UserPlusIcon } from '@heroicons/react/24/outline'

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [showSignUpGuide, setShowSignUpGuide] = useState(false)
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
      if (status === 'loading') {
        return
      }

      setIsLoading(true)

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
        await loadSessions()
      } else {
        // 認証されていない場合は何もしない（ログイン画面を表示）
      }

      setIsLoading(false)
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

  const handleSignUp = () => {
    setShowSignUpGuide(true)
  }

  const startSignUpFlow = () => {
    setShowSignUpGuide(false)
    signIn('google', {
      prompt: 'select_account'
    })
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

            {/* Googleサインアップボタン */}
            <button
              onClick={handleSignUp}
              className="w-full flex items-center justify-center gap-4 px-8 py-5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all duration-300 font-black text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <UserPlusIcon className="w-6 h-6" />
              新規アカウント作成手順
            </button>
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-400 font-medium">
              ゲストモードでは、データはブラウザに一時的に保存されます<br />
              ログイン・サインアップでは、チャット履歴が永続保存されます<br />
              <span className="text-green-400 font-semibold mt-2 block">新規の方は「新規アカウント作成手順」をクリックしてください</span>
            </p>
          </div>
        </div>
      </div>

      {/* サインアップガイドモーダル */}
      {showSignUpGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1E1E1E] rounded-xl p-8 max-w-md w-full border border-gray-600">
            <h3 className="text-2xl font-black text-white mb-6 text-center">新規アカウント作成手順</h3>
            <div className="space-y-4 text-gray-300 mb-8">
              <div className="flex items-start gap-3">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">1</span>
                <p>下の「認証を開始」ボタンをクリック</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">2</span>
                <p>アカウント選択画面で「別のアカウントを使用」をクリック</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">3</span>
                <p>「アカウントを作成」を選択</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">4</span>
                <p>必要な情報を入力してアカウントを作成</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignUpGuide(false)}
                className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={startSignUpFlow}
                className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
              >
                認証を開始
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}