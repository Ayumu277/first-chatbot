'use client'

import { UserIcon, CpuChipIcon, PencilIcon } from '@heroicons/react/24/outline'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  imageBase64?: string
  imagePreview?: string
}

interface MessageListProps {
  messages: Message[]
  editingMessageIndex: number | null
  editingContent: string
  onEditMessage: (index: number, content: string) => void
  onCancelEdit: () => void
  onResendMessage: () => void
  onImageClick: (imageUrl: string) => void
  setEditingContent: (content: string) => void
}

export default function MessageList({
  messages,
  editingMessageIndex,
  editingContent,
  onEditMessage,
  onCancelEdit,
  onResendMessage,
  onImageClick,
  setEditingContent
}: MessageListProps) {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ paddingBottom: '20vh' }}>
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex gap-3 ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          {message.role === 'assistant' && (
            <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <CpuChipIcon className="h-5 w-5 text-white" />
            </div>
          )}

          <div
            className={`max-w-[80%] rounded-lg px-4 py-2 ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-100'
            }`}
          >
            {editingMessageIndex === index ? (
              <div className="space-y-2">
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded p-2 resize-none border border-gray-600 focus:border-blue-500 focus:outline-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={onResendMessage}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    送信
                  </button>
                  <button
                    onClick={onCancelEdit}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>

                {message.imagePreview && (
                  <div className="mt-2">
                    <img
                      src={message.imagePreview}
                      alt="送信された画像"
                      className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => onImageClick(message.imagePreview!)}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {formatTimestamp(message.timestamp)}
                  </span>

                  {message.role === 'user' && (
                    <button
                      onClick={() => onEditMessage(index, message.content)}
                      className="text-gray-400 hover:text-gray-200 transition-colors"
                      title="メッセージを編集"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {message.role === 'user' && (
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-white" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}