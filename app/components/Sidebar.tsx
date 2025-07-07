'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { ChatBubbleLeftIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { useChatStore } from '../store/chat-store'

interface SidebarProps {
  selectedChatId: string | null
  onChatSelect: (chatId: string | null) => void
}

export default function Sidebar({ selectedChatId, onChatSelect }: SidebarProps) {
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)
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
    setDropdownOpen(null)
  }

  const handleDeleteChat = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    await deleteSession(sessionId)
    setDropdownOpen(null)

    // 削除されたチャットが選択されていた場合、選択を解除
    if (selectedChatId === sessionId) {
      onChatSelect(null)
    }
  }

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'たった今'
    if (diffMins < 60) return `${diffMins}分前`
    if (diffHours < 24) return `${diffHours}時間前`
    if (diffDays < 7) return `${diffDays}日前`
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
  }

    const getLastMessage = (sessionId: string) => {
    const session = displaySessions.find(s => s.id === sessionId)
    if (!session || !session.messages || session.messages.length === 0) return ''

    const lastMessage = session.messages[session.messages.length - 1]
    const truncated = lastMessage.content.length > 50
      ? lastMessage.content.substring(0, 50) + '...'
      : lastMessage.content

    return truncated
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
          displaySessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleChatSelect(session.id)}
              className={`group cursor-pointer rounded-lg p-3 mb-2 transition-colors hover:bg-gray-700 relative ${
                selectedChatId === session.id ? 'bg-gray-700' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-100 truncate">
                      {session.title}
                    </h3>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDropdownOpen(dropdownOpen === session.id ? null : session.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <EllipsisVerticalIcon className="h-4 w-4 text-gray-400 hover:text-gray-300" />
                      </button>

                      {/* ドロップダウンメニュー */}
                      {dropdownOpen === session.id && (
                        <div className="absolute right-0 top-6 w-32 bg-[#161B22] border border-gray-600 rounded-lg shadow-lg z-10">
                          <button
                            onClick={(e) => handleDeleteChat(session.id, e)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                            削除
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 mt-1 truncate font-normal">
                    {getLastMessage(session.id)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">
                    {formatTimestamp(session.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          ))
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
