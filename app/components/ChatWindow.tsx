'use client'

import { useState, useEffect } from 'react'
import { PaperAirplaneIcon, XMarkIcon, HomeIcon } from '@heroicons/react/24/outline'
import { useChatStore } from '../store/chat-store'
import ImageUpload from './ImageUpload'
import MessageList from './MessageList'

interface ChatWindowProps {
  chatId: string | null
}

interface UploadedImage {
  file: File
  base64: string
  preview: string
  mimeType: string
}

export default function ChatWindow({ chatId }: ChatWindowProps) {
  const [inputMessage, setInputMessage] = useState('')
  const [isApiLoading, setIsApiLoading] = useState(false)
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [isClient, setIsClient] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const {
    getCurrentSession,
    addMessage,
    updateMessage,
    isLoading,
    setLoading,
    setUser,
    clearSessions,
    isGuest,
    currentUser,
    setGuest,
    loadSessions
  } = useChatStore()

  const currentSession = isClient ? getCurrentSession() : null

  // クライアントサイドでのマウントを検出
  useEffect(() => {
    setIsClient(true)
  }, [])

  // クリーンアップ処理
  useEffect(() => {
    return () => {
      if (uploadedImage) {
        URL.revokeObjectURL(uploadedImage.preview)
      }
    }
  }, [uploadedImage])

  // 画像アップロード処理
  const handleImageUpload = (image: UploadedImage) => {
    setUploadedImage(image)
  }

  // 画像削除
  const handleImageRemove = () => {
    setUploadedImage(null)
  }

  const handleGoHome = () => {
    if (isGuest) {
      setUser(null)
      setGuest(false)
    } else {
      // 認証ユーザーの場合は単純にホーム画面に戻る
      window.location.href = '/'
    }
  }

  // ドラッグ&ドロップ処理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        // ImageUploadコンポーネントの処理を直接呼び出す必要があるため、
        // ここでは簡単な処理を行う
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result as string
          const base64Data = base64.split(',')[1]
          handleImageUpload({
            file,
            base64: base64Data,
            preview: base64,
            mimeType: file.type
          })
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && !uploadedImage) || isApiLoading) return

    const messageToSend = inputMessage.trim()
    const imageToSend = uploadedImage

    // 入力をクリア
    setInputMessage('')
    setUploadedImage(null)
    setIsApiLoading(true)

    try {
      // セッションが存在しない場合は新しいセッションを作成
      let sessionId = currentSession?.id
      if (!sessionId) {
        const { createSession } = useChatStore.getState()
        sessionId = await createSession()
      }

      // ユーザーメッセージを追加（一回だけ）
      const userMessage = {
        role: 'user' as const,
        content: messageToSend || '画像を送信しました',
        imageBase64: imageToSend?.base64,
        imagePreview: imageToSend?.preview
      }

      await addMessage(sessionId, userMessage)

      // 現在のセッション状態を取得
      const { getCurrentSession } = useChatStore.getState()
      const updatedSession = getCurrentSession()

      // API呼び出し
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          conversationHistory: updatedSession?.messages || [],
          imageBase64: imageToSend?.base64,
          imageMimeType: imageToSend?.mimeType,
          userId: currentUser?.id,
          sessionId: sessionId
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // AIの応答を追加（一回だけ）
      const aiMessage = {
        role: 'assistant' as const,
        content: data.message
      }

      await addMessage(sessionId, aiMessage)

    } catch (error) {
      console.error('メッセージ送信エラー:', error)
      const errorMessage = {
        role: 'assistant' as const,
        content: '申し訳ございません。エラーが発生しました。もう一度お試しください。'
      }
      if (currentSession?.id) {
        await addMessage(currentSession.id, errorMessage)
      }
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

  const handleEditMessage = (messageIndex: number, content: string) => {
    setEditingMessageIndex(messageIndex)
    setEditingContent(content)
  }

  const handleCancelEdit = () => {
    setEditingMessageIndex(null)
    setEditingContent('')
  }

  const handleResendMessage = async () => {
    if (!editingContent.trim()) return

    const updatedMessage = {
      role: 'user' as const,
      content: editingContent.trim(),
      timestamp: new Date().toISOString()
    }

    // メッセージを更新
    if (editingMessageIndex !== null) {
      updateMessage(currentSession?.id || '', editingMessageIndex, updatedMessage.content)
    }

    // 編集モードを終了
    setEditingMessageIndex(null)
    setEditingContent('')

    // 新しいメッセージでAIに再送信
    setIsApiLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: editingContent.trim(),
          conversationHistory: currentSession?.messages || [],
          userId: currentUser?.id,
          sessionId: currentSession?.id
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const aiMessage = {
        role: 'assistant' as const,
        content: data.message,
        timestamp: new Date().toISOString()
      }

      addMessage(currentSession?.id || '', aiMessage)

          } catch (error) {
        console.error('メッセージ再送信エラー:', error)
        const errorMessage = {
          role: 'assistant' as const,
          content: '申し訳ございません。エラーが発生しました。もう一度お試しください。',
          timestamp: new Date().toISOString()
        }
        addMessage(currentSession?.id || '', errorMessage)
    } finally {
      setIsApiLoading(false)
    }
  }

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl)
  }

  // サーバーサイドでは何も表示しない
  if (!isClient) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0D1117]">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0D1117] relative h-screen overflow-hidden">
      {/* ヘッダー - 常に表示 */}
      <div className="flex-shrink-0 p-4 border-b border-gray-700 bg-[#0D1117] flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-white">
            {currentSession?.title || 'chatbot'}
          </h1>
        </div>
        <button
          onClick={handleGoHome}
          className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
        >
          <HomeIcon className="h-4 w-4" />
          ホーム
        </button>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto pb-32">
        {!currentSession || !currentSession.messages || currentSession.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                AIチャットボットへようこそ
              </h2>
              <p className="text-gray-400 mb-6">
                何でもお気軽にお聞きください。画像の送信にも対応しています。
              </p>
            </div>
          </div>
        ) : (
          <MessageList
            messages={currentSession.messages}
            editingMessageIndex={editingMessageIndex}
            editingContent={editingContent}
            onEditMessage={handleEditMessage}
            onCancelEdit={handleCancelEdit}
            onResendMessage={handleResendMessage}
            onImageClick={handleImageClick}
            setEditingContent={setEditingContent}
          />
        )}
      </div>

      {/* 入力エリア - 固定フッター */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0D1117] border-t border-gray-700 p-4 z-10 md:ml-64">
        {/* アップロードされた画像のプレビュー */}
        {uploadedImage && (
          <div className="mb-3">
            <div className="relative inline-block">
              <img
                src={uploadedImage.preview}
                alt="アップロード画像"
                className="max-w-xs max-h-32 rounded-lg border border-gray-600"
              />
              <button
                onClick={handleImageRemove}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                title="画像を削除"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 items-end">
          <ImageUpload
            uploadedImage={uploadedImage}
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
            isDragOver={isDragOver}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />

          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="メッセージを入力してください..."
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 pr-12 resize-none border border-gray-600 focus:border-blue-500 focus:outline-none min-h-[48px] max-h-32"
              rows={1}
              disabled={isApiLoading}
              style={{
                height: 'auto',
                minHeight: '48px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = Math.min(target.scrollHeight, 128) + 'px'
              }}
            />

            <button
              onClick={handleSendMessage}
              disabled={(!inputMessage.trim() && !uploadedImage) || isApiLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-blue-500 hover:text-blue-400 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ローディング状態の表示 */}
        {isApiLoading && (
          <div className="mt-2 text-center">
            <div className="inline-flex items-center gap-2 text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>回答を生成中...</span>
            </div>
          </div>
        )}
      </div>

      {/* 画像モーダル */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-4xl p-4">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 text-white hover:text-gray-300 z-10"
            >
              <XMarkIcon className="h-8 w-8" />
            </button>
            <img
              src={selectedImage}
              alt="拡大表示"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* ドラッグ&ドロップオーバーレイ */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-blue-500 border-dashed rounded-lg flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center">
            <div className="text-6xl mb-4">📎</div>
            <p className="text-blue-500 font-medium text-lg">画像をドロップしてください</p>
          </div>
        </div>
      )}

      {/* ドラッグ&ドロップエリア */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  )
}