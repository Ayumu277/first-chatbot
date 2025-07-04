'use client'

import { useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { ChatBubbleLeftIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline'

interface SidebarProps {
  selectedChatId: string | null
  onChatSelect: (chatId: string | null) => void
}

// ダミーデータ
const mockChats = [
  { id: 'chat-1', title: 'React開発の相談', lastMessage: '最新のReactフックについて', timestamp: '2時間前' },
  { id: 'chat-2', title: 'TypeScript設定', lastMessage: 'tsconfig.jsonの設定について', timestamp: '昨日' },
  { id: 'chat-3', title: 'Next.js App Router', lastMessage: 'App Routerの使い方について', timestamp: '2日前' },
  { id: 'chat-4', title: 'TailwindCSSのカスタマイズ', lastMessage: 'カスタムテーマの作り方', timestamp: '3日前' },
  { id: 'chat-5', title: 'APIの設計', lastMessage: 'RESTとGraphQLの選択について', timestamp: '5日前' },
  { id: 'chat-6', title: 'データベース設計', lastMessage: 'PostgreSQLかMySQLか', timestamp: '1週間前' },
]

export default function Sidebar({ selectedChatId, onChatSelect }: SidebarProps) {
  const [chats, setChats] = useState(mockChats)

  const handleNewChat = () => {
    const newChatId = `chat-${Date.now()}`
    const newChat = {
      id: newChatId,
      title: '新しいチャット',
      lastMessage: '',
      timestamp: 'たった今'
    }
    setChats([newChat, ...chats])
    onChatSelect(newChatId)
  }

  return (
    <aside className="hidden md:block w-64 bg-[#161B22] h-full flex flex-col border-r border-gray-700">
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
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onChatSelect(chat.id)}
            className={`group cursor-pointer rounded-lg p-3 mb-2 transition-colors hover:bg-gray-700 ${
              selectedChatId === chat.id ? 'bg-gray-700' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-100 truncate">
                    {chat.title}
                  </h3>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <EllipsisVerticalIcon className="h-4 w-4 text-gray-400 hover:text-gray-300" />
                  </button>
                </div>
                <p className="text-xs text-gray-300 mt-1 truncate font-normal">
                  {chat.lastMessage}
                </p>
                <p className="text-xs text-gray-400 mt-1 font-medium">
                  {chat.timestamp}
                </p>
              </div>
            </div>
          </div>
        ))}
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