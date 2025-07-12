'use client'

import { useState, useEffect } from 'react'
import { PaperAirplaneIcon, PaperClipIcon, PencilIcon, XMarkIcon, PhotoIcon, HomeIcon } from '@heroicons/react/24/outline'
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
  const [uploadedImage, setUploadedImage] = useState<{
    file: File
    base64: string
    preview: string
    mimeType: string
  } | null>(null)
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
    currentUser
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

  // 画像ファイルをBase64に変換
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        // data:image/jpeg;base64, の部分を除去（API用）
        const base64Data = base64.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const convertToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const dataURL = reader.result as string
        resolve(dataURL)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // 画像ファイルの処理
  const handleImageUpload = async (file: File) => {
    // 画像ファイルのみを許可
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルのみアップロード可能です')
      return
    }

    try {
      const base64 = await convertToBase64(file)
      const dataURL = await convertToDataURL(file)

      setUploadedImage({
        file,
        base64,
        preview: dataURL, // 完全なデータURLを使用
        mimeType: file.type
      })
    } catch (error) {
      console.error('画像の読み込みに失敗しました:', error)
      alert('画像の読み込みに失敗しました')
    }
  }

  // 画像削除
  const handleImageRemove = () => {
    setUploadedImage(null)
  }

  const handleGoHome = () => {
    // ゲストトークンをクリア
    localStorage.removeItem('guestToken')
    // ユーザー状態をリセット
    setUser(null)
    // セッションをクリア
    clearSessions()
  }

  // ドラッグ＆ドロップハンドラー
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
      handleImageUpload(files[0])
    }
  }

  // ファイル選択（クリック）
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleImageUpload(files[0])
    }
  }

  // chatIdが変更されたときの処理
  useEffect(() => {
    if (chatId && currentSession?.id !== chatId) {
      // 別のセッションが選択された場合の処理
      // この場合、親コンポーネントでselectSessionを呼び出す必要がある
    }
  }, [chatId, currentSession?.id])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || isApiLoading || !currentUser) return

    const userMessage = {
      role: 'user' as const,
      content: inputMessage,
      imageBase64: uploadedImage?.base64,
      imagePreview: uploadedImage?.preview
    }

    const currentMessage = inputMessage
    const currentImageBase64 = uploadedImage?.base64
    const currentImageMimeType = uploadedImage?.mimeType
    setInputMessage('')
    setIsApiLoading(true)

    // 画像をクリア
    if (uploadedImage) {
      handleImageRemove()
    }

    try {
      // 会話履歴をAPI用の形式に変換
      const conversationHistory = currentSession.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      console.log('API呼び出し開始:', {
        message: currentMessage,
        hasImage: !!currentImageBase64,
        historyLength: conversationHistory.length,
        userId: currentUser.id,
        sessionId: currentSession.id
      })

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          conversationHistory,
          imageBase64: currentImageBase64,
          imageMimeType: currentImageMimeType,
          userId: currentUser.id,
          sessionId: currentSession.id
        }),
      })

      console.log('API応答受信:', {
        status: response.status,
        ok: response.ok
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('API応答エラー:', data)
        throw new Error(data.error || 'APIエラーが発生しました')
      }

      console.log('API応答成功:', data)

      // セッションIDが返された場合、ローカルセッションを更新
      if (data.sessionId && data.sessionId !== currentSession.id) {
        console.log('セッションIDが更新されました:', data.sessionId)
        // 必要に応じてセッションIDを更新する処理をここに追加
      }

      // メッセージの追加はチャットAPIで既にデータベースに保存されているため
      // ローカルストレージの更新のみ行う
      await addMessage(currentSession.id, userMessage)

      // AIの応答を追加
      const aiMessage = {
        role: 'assistant' as const,
        content: data.message
      }

      await addMessage(currentSession.id, aiMessage)

    } catch (error) {
      console.error('Chat error:', error)

      const errorMessage = {
        role: 'assistant' as const,
        content: error instanceof Error ? error.message : 'エラーが発生しました。もう一度お試しください。'
      }

      await addMessage(currentSession.id, errorMessage)
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
    if (!currentSession || !editingContent.trim() || editingMessageIndex === null || !currentUser) return

    setIsApiLoading(true)

    try {
      // 編集されたメッセージで更新
      updateMessage(currentSession.id, editingMessageIndex, editingContent.trim())

      // 編集後のメッセージまでの会話履歴を構築
      const editedMessages = currentSession.messages.slice(0, editingMessageIndex + 1)
      const originalMessage = editedMessages[editingMessageIndex]
      editedMessages[editingMessageIndex] = {
        ...originalMessage,
        content: editingContent.trim()
      }

      const conversationHistory = editedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // チャットAPIに再送信
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: editingContent.trim(),
          conversationHistory: conversationHistory.slice(0, -1), // 最後のメッセージは除く
          imageBase64: originalMessage.imageBase64,
          imageMimeType: 'image/jpeg', // 再送信時はデフォルト値
          userId: currentUser.id,
          sessionId: currentSession.id
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

      await addMessage(currentSession.id, aiMessage)

      // 編集状態をリセット
      setEditingMessageIndex(null)
      setEditingContent('')

    } catch (error) {
      console.error('Resend error:', error)

      const errorMessage = {
        role: 'assistant' as const,
        content: error instanceof Error ? error.message : 'エラーが発生しました。もう一度お試しください。'
      }

      await addMessage(currentSession.id, errorMessage)
    } finally {
      setIsApiLoading(false)
    }
  }

  if (!currentSession) {
    return (
      <div className="flex flex-col h-full relative">
        <div className="flex-1 flex flex-col items-center justify-center px-4">
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

        {/* 左下のホームに戻るボタン */}
        <div className="absolute bottom-4 left-4">
          <button
            onClick={handleGoHome}
            className="group relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] hover:from-[#0066ff] hover:to-[#0099ff] text-white rounded-xl transition-all duration-300 text-sm font-bold shadow-xl shadow-blue-500/40 hover:shadow-blue-500/60 transform hover:scale-110 border border-blue-400/30"
          >
            <div className="relative">
              <HomeIcon className="w-5 h-5 relative z-10" />
              <div className="absolute inset-0 w-5 h-5 bg-white/30 rounded-full blur-sm group-hover:blur-md transition-all duration-300"></div>
            </div>
            <span className="tracking-wide">ホーム</span>

            {/* グローエフェクト */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-25 transition-opacity duration-300 blur-sm"></div>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* チャットヘッダー */}
      <div className="flex-shrink-0 border-b border-gray-700 p-4 flex items-center justify-between bg-gradient-to-r from-[#0D1117] to-[#161B22]">
        <h1 className="text-lg font-semibold text-white">
          {currentSession.title}
        </h1>

        {/* ホームに戻るボタン - 近未来的デザイン */}
        <button
          onClick={handleGoHome}
          className="group relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1E90FF] to-[#00BFFF] hover:from-[#0066ff] hover:to-[#0099ff] text-white rounded-lg transition-all duration-300 text-sm font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transform hover:scale-105 border border-blue-400/30"
        >
          <div className="relative">
            <HomeIcon className="w-4 h-4 relative z-10" />
            <div className="absolute inset-0 w-4 h-4 bg-white/20 rounded-full blur-sm group-hover:blur-md transition-all duration-300"></div>
          </div>
          <span className="tracking-wide">ホーム</span>

          {/* グローエフェクト */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm"></div>
        </button>
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
                    {/* 画像表示（ユーザーメッセージで画像がある場合） */}
                    {message.role === 'user' && message.imagePreview && (
                      <div className="mb-3">
                        <img
                          src={message.imagePreview}
                          alt="送信した画像"
                          className="max-w-[200px] sm:max-w-[250px] max-h-24 sm:max-h-32 rounded-lg object-contain cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedImage(message.imagePreview!)}
                        />
                      </div>
                    )}

                    <div className="whitespace-pre-wrap break-words text-sm sm:text-base font-normal leading-relaxed">
                      {message.content}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-2 text-xs opacity-70 font-medium">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          message.role === 'user'
                            ? 'bg-blue-900 text-blue-200'
                            : 'bg-green-900 text-green-200'
                        }`}>
                          {message.role === 'user' ? 'ユーザー' : 'AI'}
                        </span>
                        <span>{message.timestamp}</span>
                      </div>
                      {/* 編集ボタン（ユーザーメッセージのみ、画像なしの場合のみ） */}
                      {message.role === 'user' && !message.imagePreview && (
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
        <div className="space-y-3">
          {/* 画像プレビュー（アップロード後のみ表示） */}
          {uploadedImage && (
            <div className="relative inline-block">
              <img
                src={uploadedImage.preview}
                alt="アップロード画像"
                className="max-w-full max-h-32 rounded-lg object-contain"
              />
              <button
                onClick={handleImageRemove}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* テキスト入力エリア */}
          <div className="flex gap-3 items-end">
            {/* ファイル選択ボタン */}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <button className="p-2 text-gray-400 hover:text-gray-300 transition-colors cursor-pointer">
                <PaperClipIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                placeholder="メッセージを入力してください..."
                className={`w-full px-4 py-3 bg-[#161B22] border rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1E90FF] focus:border-transparent resize-none text-sm sm:text-base font-normal transition-colors ${
                  isDragOver
                    ? 'border-[#1E90FF] bg-blue-900/10'
                    : 'border-gray-600'
                }`}
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
              {/* ドラッグオーバー時のオーバーレイ */}
              {isDragOver && (
                <div className="absolute inset-0 border-2 border-[#1E90FF] border-dashed rounded-lg bg-blue-900/20 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <PhotoIcon className="w-8 h-8 mx-auto text-[#1E90FF] mb-1" />
                    <p className="text-sm text-[#1E90FF] font-medium">画像をドロップしてください</p>
                  </div>
                </div>
              )}
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

      {/* 画像拡大モーダル */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="拡大画像"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full flex items-center justify-center text-white transition-all"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}