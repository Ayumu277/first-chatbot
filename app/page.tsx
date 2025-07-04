'use client'

import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import { useChatStore } from './store/chat-store'

export default function Home() {
  const [isClient, setIsClient] = useState(false)
  const { currentSessionId, selectSession } = useChatStore()

  // クライアントサイドでのマウントを検出
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleChatSelect = (sessionId: string | null) => {
    if (sessionId) {
      selectSession(sessionId)
    }
  }

  const displaySessionId = isClient ? currentSessionId : null

      return (
      <div className="flex h-screen bg-[#0D1117] text-white overflow-hidden">
        <Sidebar selectedChatId={displaySessionId} onChatSelect={handleChatSelect} />
        <main className="flex-1 flex flex-col items-center">
          <div className="w-full max-w-3xl h-full">
            <ChatWindow chatId={displaySessionId} />
          </div>
        </main>
      </div>
    )
}