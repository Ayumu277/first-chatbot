'use client'

import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'

export default function Home() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>('chat-1')

  return (
    <div className="flex h-screen bg-[#0D1117] text-white overflow-hidden">
      <Sidebar selectedChatId={selectedChatId} onChatSelect={setSelectedChatId} />
      <main className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-3xl h-full">
          <ChatWindow chatId={selectedChatId} />
        </div>
      </main>
    </div>
  )
}