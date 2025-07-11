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
    signIn('google')
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
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-400 font-medium">
              ゲストモードでは、データはブラウザに一時的に保存されます
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}