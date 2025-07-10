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

  useEffect(() => {
    setIsClient(true)

    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleChatSelect = (sessionId: string | null) => {
    if (sessionId) selectSession(sessionId)
    setIsSidebarOpen(false)
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleOverlayClick = () => {
    setIsSidebarOpen(false)
  }

  const displaySessionId = isClient ? currentSessionId : null

  return (
    <AuthWrapper>
      <div className="flex h-screen bg-[#0D1117] text-white overflow-hidden">
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

        {/* オーバーレイ */}
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleOverlayClick}
          />
        )}

        {/* サイドバー */}
        <div
          className={`${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 fixed md:static inset-y-0 left-0 z-30 w-64 transition-transform duration-300 ease-in-out`}
        >
          <Sidebar
            selectedChatId={displaySessionId}
            onChatSelect={handleChatSelect}
          />
        </div>

        {/* メイン */}
        <main className="flex-1 flex flex-col min-w-0">
          <ChatWindow chatId={displaySessionId} />
        </main>
      </div>
    </AuthWrapper>
  )
}
