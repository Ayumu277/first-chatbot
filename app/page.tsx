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
  const { currentSessionId, selectSession } = useChatStore()

  // クライアントサイドでのマウントを検出
  useEffect(() => {
    setIsClient(true)

    // デスクトップの場合、サイドバーを開く
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true)
      } else {
        setIsSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
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

  return (
    <AuthWrapper>
      <div className="flex h-screen bg-dark-theme text-light-theme overflow-hidden" style={{
        backgroundColor: '#0D1117',
        color: '#C9D1D9'
      }}>
        {/* モバイル用ハンバーガーボタン */}
        <button
          onClick={toggleSidebar}
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar rounded-lg border border-theme hover:bg-gray-700 transition-colors"
          style={{
            backgroundColor: '#161B22',
            borderColor: '#30363D'
          }}
        >
          {isSidebarOpen ? (
            <XMarkIcon className="w-6 h-6 text-light-theme" style={{color: '#C9D1D9'}} />
          ) : (
            <Bars3Icon className="w-6 h-6 text-light-theme" style={{color: '#C9D1D9'}} />
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
          w-64 transition-transform duration-300 ease-in-out
        `}>
          <Sidebar
            selectedChatId={displaySessionId}
            onChatSelect={handleChatSelect}
          />
        </div>

        {/* メインコンテンツ */}
        <main className="flex-1 flex flex-col min-w-0">
              <ChatWindow chatId={displaySessionId} />
        </main>
      </div>
    </AuthWrapper>
  )
}