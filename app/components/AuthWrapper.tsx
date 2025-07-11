'use client'

import { useSession } from 'next-auth/react'
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

  // ローディング中
  if (isLoading || status === 'loading') {
    return (
      <div className="flex h-screen bg-[#0D1117] text-white items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E90FF] mx-auto mb-4"></div>
          <p className="text-gray-300 font-medium">読み込み中...</p>
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
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#1E90FF] rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              chatbot
            </h1>
            <p className="text-gray-300">
              ログインまたはゲストモードでチャットを始めましょう
            </p>
          </div>

          <div className="space-y-4">
            {/* ゲストモードボタン */}
            <button
              onClick={handleGuestMode}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#1E90FF] hover:bg-blue-600 text-white rounded-lg transition-colors font-bold"
            >
              <GlobeAltIcon className="w-5 h-5" />
              ゲストとして始める
            </button>

            {/* ログインボタン（将来の拡張用） */}
            <button
              disabled
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-600 text-gray-400 rounded-lg cursor-not-allowed font-medium"
            >
              <UserIcon className="w-5 h-5" />
              ログイン（準備中）
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              ゲストモードでは、データはブラウザに一時的に保存されます
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}