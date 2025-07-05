'use client'

import { useEffect, useState } from 'react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import AuthWrapper from './components/AuthWrapper'
import { useChatStore } from './store/chat-store'

export default function Home() {
  const [isClient, setIsClient] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { currentSessionId, selectSession } = useChatStore()

  // クライアントサイドでのマウントを検出
  useEffect(() => {
    setIsClient(true)
    setIsLoading(false)
  }, [])

  // セッション選択ハンドラー
  const handleChatSelect = (sessionId: string | null) => {
    if (sessionId) {
      selectSession(sessionId)
    }
    // モバイルでサイドバーを閉じる
    setIsSidebarOpen(false)
  }

  // サイドバーの開閉
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  // サイドバーの外側をクリックした時に閉じる
  const handleOverlayClick = () => {
    setIsSidebarOpen(false)
  }

  const displaySessionId = isClient ? currentSessionId : null

  // ローディング状態
  if (isLoading) {
    return (
      <div className="flex h-screen bg-[#0D1117] text-white items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E90FF] mx-auto mb-4"></div>
          <p className="text-gray-300 font-medium">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthWrapper>
      <div className="flex h-screen bg-[#0D1117] text-white overflow-hidden">
        {/* モバイル用ハンバーガーボタン */}
        <button
          onClick={toggleSidebar}
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#161B22] rounded-lg border border-gray-700 hover:bg-[#21262D] transition-colors"
        >
          {isSidebarOpen ? (
            <XMarkIcon className="w-6 h-6 text-white" />
          ) : (
            <Bars3Icon className="w-6 h-6 text-white" />
          )}
        </button>

        {/* モバイル用オーバーレイ */}
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleOverlayClick}
          />
        )}

        {/* サイドバー */}
        <div className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 fixed md:static inset-y-0 left-0 z-30
          w-64 md:w-80 transition-transform duration-300 ease-in-out
        `}>
          <Sidebar
            selectedChatId={displaySessionId}
            onChatSelect={handleChatSelect}
          />
        </div>

        {/* メインコンテンツ */}
        <main className="flex-1 flex flex-col items-center min-w-0">
          <div className="w-full max-w-4xl h-full flex flex-col">
            {/* チャットウィンドウ */}
            <div className="flex-1 flex flex-col">
              <ChatWindow chatId={displaySessionId} />
            </div>
          </div>
        </main>
      </div>
    </AuthWrapper>
  )
}