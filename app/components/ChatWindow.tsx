'use client'

import { useState, useEffect, useCallback } from 'react'
import { PaperAirplaneIcon, XMarkIcon, HomeIcon } from '@heroicons/react/24/outline'
import { useChatStore } from '../store/chat-store'
import { useChatInput } from '../hooks/useChatInput'
import { useChatActions } from '../hooks/useChatActions'
import { useAutoScroll } from '../hooks/useAutoScroll'
import { classNames } from '../utils/helpers'
import { THEME_COLORS, SPACING, SIZES } from '../constants/theme'
import ImageUpload from './ImageUpload'
import MessageList from './MessageList'

interface ChatWindowProps {
  chatId: string | null
}

export default function ChatWindow({ chatId }: ChatWindowProps) {
  const [isClient, setIsClient] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // カスタムフック
  const {
    inputMessage,
    setInputMessage,
    uploadedImage,
    isDragOver,
    handleImageUpload,
    handleImageRemove,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearInput
  } = useChatInput()

  const {
    scrollContainerRef,
    scrollOnMessageUpdate,
    handleScroll
  } = useAutoScroll()

  const {
    isApiLoading,
    editingMessageIndex,
    editingContent,
    setEditingContent,
    sendMessage,
    editMessage,
    cancelEdit,
    resendMessage
  } = useChatActions(scrollOnMessageUpdate)

  // ストア
  const {
    getCurrentSession,
    setUser,
    isGuest,
    setGuest
  } = useChatStore()

  const currentSession = isClient ? getCurrentSession() : null

  // クライアントサイドでのマウントを検出
  useEffect(() => {
    setIsClient(true)
  }, [])

  // セッション変更時に最下部にスクロール
  useEffect(() => {
    if (currentSession) {
      scrollOnMessageUpdate()
    }
  }, [currentSession?.id, scrollOnMessageUpdate])

  // クリーンアップ処理
  useEffect(() => {
    return () => {
      if (uploadedImage) {
        URL.revokeObjectURL(uploadedImage.preview)
      }
    }
  }, [uploadedImage])

  // イベントハンドラー
  const handleGoHome = useCallback(() => {
    if (isGuest) {
      setUser(null)
      setGuest(false)
    }
  }, [isGuest, setUser, setGuest])

  const handleSendMessage = useCallback(() => {
    sendMessage(inputMessage, uploadedImage, clearInput)
  }, [sendMessage, inputMessage, uploadedImage, clearInput])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  const handleImageClick = useCallback((imageUrl: string) => {
    setSelectedImage(imageUrl)
  }, [])

  // サーバーサイドレンダリング対応
  if (!isClient) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0D1117]">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    )
  }

  return (
    <div
      className="flex-1 relative h-screen grid grid-rows-[auto_1fr_auto] overflow-hidden max-h-screen"
      style={{ backgroundColor: THEME_COLORS.background.primary }}
    >
      {/* ヘッダー */}
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

      {/* メッセージエリア - Grid行で自動的に残り空間を占有 */}
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto scroll-smooth bg-[#0D1117] px-4 py-6"
        onScroll={handleScroll}
        style={{
          minHeight: 0, // Grid子要素でのoverflow確保
          scrollPaddingBottom: '2rem'
        }}
      >
        {!currentSession || !currentSession.messages || currentSession.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
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
          <div className="space-y-4 pb-16">
            <MessageList
              messages={currentSession.messages}
              editingMessageIndex={editingMessageIndex}
              editingContent={editingContent}
              onEditMessage={editMessage}
              onCancelEdit={cancelEdit}
              onResendMessage={resendMessage}
              onImageClick={handleImageClick}
              setEditingContent={setEditingContent}
            />
          </div>
        )}
      </div>

      {/* フッター入力エリア - Grid行で固定高 */}
      <div className="bg-gray-800 border-t-2 border-gray-600 p-4 shadow-lg md:mr-0">
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
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 pr-12 resize-none border-2 border-gray-600 focus:border-blue-500 focus:outline-none min-h-[48px] max-h-32 shadow-sm"
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

        {/* ローディング状態 */}
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