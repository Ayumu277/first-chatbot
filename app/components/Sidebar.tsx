'use client'

import { useState, useEffect } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useChatStore } from '../store/chat-store'
import SessionItem from './SessionItem'

interface SidebarProps {
  selectedChatId: string | null
  onChatSelect: (chatId: string | null) => void
}

export default function Sidebar({ selectedChatId, onChatSelect }: SidebarProps) {
  const [isClient, setIsClient] = useState(false)

  const {
    sessions,
    createSession,
    selectSession,
    deleteSession,
    currentSessionId
  } = useChatStore()

  // クライアントサイドでのマウントを検出
  useEffect(() => {
    setIsClient(true)
  }, [])

  // サーバーサイドでは空の配列を表示
  const displaySessions = isClient ? sessions : []

  const handleNewChat = async () => {
    const newSessionId = await createSession()
    selectSession(newSessionId)
    onChatSelect(newSessionId)
  }

  const handleChatSelect = (sessionId: string) => {
    selectSession(sessionId)
    onChatSelect(sessionId)
  }

  const handleDeleteChat = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    await deleteSession(sessionId)

    // 削除されたチャットが選択されていた場合、選択を解除
    if (selectedChatId === sessionId) {
      onChatSelect(null)
    }
  }

  return (
    <aside className="w-64 bg-[#161B22] h-full flex flex-col border-r border-gray-700">
      {/* ヘッダー */}
      <div className="flex-shrink-0 p-4 border-b border-gray-700">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1E90FF] hover:bg-blue-600 text-white transition-colors font-medium"
        >
          <PlusIcon className="h-4 w-4" />
          新規チャット
        </button>
      </div>

      {/* チャット履歴 */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {displaySessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">まだチャットがありません</p>
            <p className="text-gray-500 text-xs mt-1">新規チャットを作成してください</p>
          </div>
        ) : (
          <div className="space-y-1">
            {displaySessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isSelected={selectedChatId === session.id}
                onSelect={handleChatSelect}
                onDelete={handleDeleteChat}
              />
            ))}
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="flex-shrink-0 p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[#1E90FF] flex items-center justify-center">
            <span className="text-white text-sm font-medium">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">ユーザー</p>
            <p className="text-xs text-gray-300 font-medium">オンライン</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
