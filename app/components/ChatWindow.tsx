'use client'

import { useState, useEffect } from 'react'
import { PaperAirplaneIcon, PaperClipIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { UserIcon, CpuChipIcon } from '@heroicons/react/24/solid'
import { useChatStore } from '../store/chat-store'

interface ChatWindowProps {
  chatId: string | null
}

export default function ChatWindow({ chatId }: ChatWindowProps) {
  const [inputMessage, setInputMessage] = useState('')
  const [isApiLoading, setIsApiLoading] = useState(false)
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [isClient, setIsClient] = useState(false)

  const {
    getCurrentSession,
    addMessage,
    updateMessage,
    isLoading,
    setLoading
  } = useChatStore()

  const currentSession = isClient ? getCurrentSession() : null

  // クライアントサイドでのマウントを検出
  useEffect(() => {
    setIsClient(true)
  }, [])

  // chatIdが変更されたときの処理
  useEffect(() => {
    if (chatId && currentSession?.id !== chatId) {
      // 別のセッションが選択された場合の処理
      // この場合、親コンポーネントでselectSessionを呼び出す必要がある
    }
  }, [chatId, currentSession?.id])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || isApiLoading) return

    const userMessage = {
      role: 'user' as const,
      content: inputMessage
    }

    const currentMessage = inputMessage
    setInputMessage('')
    setIsApiLoading(true)

    // ユーザーメッセージを追加
    addMessage(currentSession.id, userMessage)

    try {
      // 会話履歴をAPI用の形式に変換
      const conversationHistory = currentSession.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          conversationHistory
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'APIエラーが発生しました')
      }

      // AIの応答を追加
      const aiMessage = {
        role: 'assistant' as const,
        content: data.message
      }

      addMessage(currentSession.id, aiMessage)

    } catch (error) {
      console.error('Chat error:', error)

      const errorMessage = {
        role: 'assistant' as const,
        content: error instanceof Error ? error.message : 'エラーが発生しました。もう一度お試しください。'
      }

      addMessage(currentSession.id, errorMessage)
    } finally {
      setIsApiLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 編集機能の関数
  const handleEditMessage = (messageIndex: number, content: string) => {
    setEditingMessageIndex(messageIndex)
    setEditingContent(content)
  }

  const handleCancelEdit = () => {
    setEditingMessageIndex(null)
    setEditingContent('')
  }

  const handleResendMessage = async () => {
    if (!currentSession || !editingContent.trim() || editingMessageIndex === null) return

    setIsApiLoading(true)

    try {
      // 編集されたメッセージで更新
      updateMessage(currentSession.id, editingMessageIndex, editingContent.trim())

      // 編集後のメッセージまでの会話履歴を構築
      const editedMessages = currentSession.messages.slice(0, editingMessageIndex + 1)
      editedMessages[editingMessageIndex] = {
        ...editedMessages[editingMessageIndex],
        content: editingContent.trim()
      }

      const conversationHistory = editedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // OpenAI APIに再送信
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: editingContent.trim(),
          conversationHistory: conversationHistory.slice(0, -1) // 最後のメッセージは除く
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'APIエラーが発生しました')
      }

      // 新しいAIの応答を追加
      const aiMessage = {
        role: 'assistant' as const,
        content: data.message
      }

      addMessage(currentSession.id, aiMessage)

      // 編集状態をリセット
      setEditingMessageIndex(null)
      setEditingContent('')

    } catch (error) {
      console.error('Resend error:', error)

      const errorMessage = {
        role: 'assistant' as const,
        content: error instanceof Error ? error.message : 'エラーが発生しました。もう一度お試しください。'
      }

      addMessage(currentSession.id, errorMessage)
    } finally {
      setIsApiLoading(false)
    }
  }

  if (!currentSession) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#161B22] rounded-full flex items-center justify-center mx-auto mb-4">
            <CpuChipIcon className="w-8 h-8 text-[#1E90FF]" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">チャットを選択してください</h2>
          <p className="text-gray-300 text-sm sm:text-base font-medium">
            <span className="hidden md:inline">左側のサイドバーから会話を選択するか、</span>
            新規チャットを開始してください。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* チャットヘッダー */}
      <div className="flex-shrink-0 border-b border-gray-700 p-4">
        <h1 className="text-lg font-semibold text-white text-center md:text-left">
          {currentSession.title}
        </h1>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-6 md:px-4 py-4">
        {currentSession.messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-300 text-sm sm:text-base font-medium">まだメッセージがありません。最初のメッセージを送信してください。</p>
          </div>
        ) : (
          <div className="space-y-6">
            {currentSession.messages.map((message, index) => (
              <div
                key={`${currentSession.id}-${index}`}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-[#1E90FF] flex items-center justify-center flex-shrink-0">
                    <CpuChipIcon className="w-5 h-5 text-white" />
                  </div>
                )}

                {/* 編集中のメッセージ */}
                {editingMessageIndex === index && message.role === 'user' ? (
                  <div className="max-w-[85%] sm:max-w-[75%] md:max-w-[70%] px-4 py-3 rounded-lg bg-gray-700 border-2 border-gray-500">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleResendMessage()
                        }
                      }}
                      className="w-full bg-gray-600 text-white rounded-md px-3 py-2 text-sm sm:text-base font-normal leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#1E90FF]"
                      rows={3}
                      style={{ minHeight: '60px' }}
                      placeholder="メッセージを編集してください..."
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleCancelEdit}
                        disabled={isApiLoading}
                        className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XMarkIcon className="w-4 h-4 inline mr-1" />
                        キャンセル
                      </button>
                      <button
                        onClick={handleResendMessage}
                        disabled={isApiLoading || !editingContent.trim()}
                        className="px-3 py-1 text-sm bg-[#1E90FF] hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PaperAirplaneIcon className="w-4 h-4 inline mr-1" />
                        再送信
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 通常のメッセージ */
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] px-4 py-3 rounded-lg group relative ${
                      message.role === 'user'
                        ? 'bg-[#1E90FF] text-white'
                        : 'bg-[#161B22] text-white border border-gray-700'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words text-sm sm:text-base font-normal leading-relaxed">
                      {message.content}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs opacity-70 font-medium">
                        {message.timestamp}
                      </div>
                      {/* 編集ボタン（ユーザーメッセージのみ） */}
                      {message.role === 'user' && (
                        <button
                          onClick={() => handleEditMessage(index, message.content)}
                          disabled={isApiLoading}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-blue-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <PencilIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}

            {/* ローディング表示 */}
            {isApiLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-[#1E90FF] flex items-center justify-center flex-shrink-0">
                  <CpuChipIcon className="w-5 h-5 text-white" />
                </div>
                <div className="max-w-[85%] sm:max-w-[75%] md:max-w-[70%] px-4 py-3 rounded-lg bg-[#161B22] text-white border border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-[#1E90FF] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#1E90FF] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-[#1E90FF] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-300">AIが回答を生成中...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 入力エリア */}
      <div className="flex-shrink-0 border-t border-gray-700 p-4 bg-[#0D1117]">
        <div className="flex gap-3 items-end">
          <button className="p-2 text-gray-400 hover:text-gray-300 transition-colors hidden sm:block">
            <PaperClipIcon className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="メッセージを入力してください..."
              className="w-full px-4 py-3 bg-[#161B22] border border-gray-600 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1E90FF] focus:border-transparent resize-none text-sm sm:text-base font-normal"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isApiLoading}
            className="p-2 text-[#1E90FF] hover:text-blue-400 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}