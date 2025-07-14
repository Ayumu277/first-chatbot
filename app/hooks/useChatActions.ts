import { useState, useCallback } from 'react'
import { useChatStore } from '../store/chat-store'
import { UploadedImage, ChatMessage } from '../types/chat'

export const useChatActions = (onMessageUpdate?: () => void) => {
  const [isApiLoading, setIsApiLoading] = useState(false)
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')

  const {
    getCurrentSession,
    addMessage,
    updateMessage,
    currentUser
  } = useChatStore()

  const sendMessage = useCallback(async (
    message: string,
    uploadedImage: UploadedImage | null,
    onClearInput: () => void
  ) => {
    if ((!message.trim() && !uploadedImage) || isApiLoading) return

    const messageToSend = message.trim()
    const imageToSend = uploadedImage

    onClearInput()
    setIsApiLoading(true)

    try {
      const currentSession = getCurrentSession()
      let sessionId = currentSession?.id

      if (!sessionId) {
        const { createSession } = useChatStore.getState()
        sessionId = await createSession()
      }

      // ユーザーメッセージを追加
      const userMessage: ChatMessage = {
        role: 'user',
        content: messageToSend || '画像を送信しました',
        imageBase64: imageToSend?.base64,
        imagePreview: imageToSend?.preview
      }

            await addMessage(sessionId, userMessage)
      onMessageUpdate?.()

      // 更新されたセッション状態を取得
       const { getCurrentSession: getUpdatedSession } = useChatStore.getState()
       const updatedSession = getUpdatedSession()

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

      // AIの応答を追加
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: data.message
      }

      await addMessage(sessionId, aiMessage)
      onMessageUpdate?.()

    } catch (error) {
      console.error('メッセージ送信エラー:', error)
      const currentSession = getCurrentSession()
      if (currentSession?.id) {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: 'ネットワークエラーが発生しました。接続を確認して、もう一度お試しください。'
        }
        await addMessage(currentSession.id, errorMessage)
        onMessageUpdate?.()
      }
    } finally {
      setIsApiLoading(false)
    }
  }, [isApiLoading, getCurrentSession, addMessage, currentUser])

  const editMessage = useCallback((messageIndex: number, content: string) => {
    setEditingMessageIndex(messageIndex)
    setEditingContent(content)
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingMessageIndex(null)
    setEditingContent('')
  }, [])

  const resendMessage = useCallback(async () => {
    if (!editingContent.trim()) return

    const currentSession = getCurrentSession()

    // メッセージを更新
    if (editingMessageIndex !== null && currentSession?.id) {
      updateMessage(currentSession.id, editingMessageIndex, editingContent.trim())
    }

    // 編集モードを終了
    setEditingMessageIndex(null)
    setEditingContent('')

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

      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString()
      }

      if (currentSession?.id) {
        addMessage(currentSession.id, aiMessage)
        onMessageUpdate?.()
      }

    } catch (error) {
      console.error('メッセージ再送信エラー:', error)
      if (currentSession?.id) {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: '申し訳ございません。エラーが発生しました。もう一度お試しください。',
          timestamp: new Date().toISOString()
        }
        addMessage(currentSession.id, errorMessage)
        onMessageUpdate?.()
      }
    } finally {
      setIsApiLoading(false)
    }
  }, [editingContent, editingMessageIndex, getCurrentSession, updateMessage, addMessage, currentUser])

  return {
    isApiLoading,
    editingMessageIndex,
    editingContent,
    setEditingContent,
    sendMessage,
    editMessage,
    cancelEdit,
    resendMessage
  }
}