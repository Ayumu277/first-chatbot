'use client'

import { useState } from 'react'
import { TrashIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline'

interface SessionItemProps {
  session: {
    id: string
    title: string
    messages: any[]
    createdAt: string
    updatedAt: string
  }
  isSelected: boolean
  onSelect: (sessionId: string) => void
  onDelete: (sessionId: string, event: React.MouseEvent) => void
}

export default function SessionItem({ session, isSelected, onSelect, onDelete }: SessionItemProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

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

  const getLastMessage = () => {
    if (!session.messages || session.messages.length === 0) return ''

    const lastMessage = session.messages[session.messages.length - 1]
    const truncated = lastMessage.content.length > 50
      ? lastMessage.content.substring(0, 50) + '...'
      : lastMessage.content

    return truncated
  }

  const handleSelect = () => {
    onSelect(session.id)
    setDropdownOpen(false)
  }

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation()
    onDelete(session.id, event)
    setDropdownOpen(false)
  }

  return (
    <div
      className={`relative p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
        isSelected
          ? 'bg-blue-600 text-white'
          : 'hover:bg-gray-700 text-gray-300'
      }`}
      onClick={handleSelect}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <ChatBubbleLeftIcon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm truncate">
              {session.title}
            </h3>

            <div className="flex items-center gap-1">
              <span className="text-xs opacity-70">
                {formatTimestamp(session.updatedAt)}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setDropdownOpen(!dropdownOpen)
                }}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-600 transition-all duration-200"
              >
                <EllipsisVerticalIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {getLastMessage() && (
            <p className="text-xs opacity-70 mt-1 truncate">
              {getLastMessage()}
            </p>
          )}
        </div>
      </div>

      {/* ドロップダウンメニュー */}
      {dropdownOpen && (
        <div className="absolute right-2 top-8 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 min-w-[120px]">
          <button
            onClick={handleDelete}
            className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 rounded-lg flex items-center gap-2"
          >
            <TrashIcon className="h-4 w-4" />
            削除
          </button>
        </div>
      )}
    </div>
  )
}