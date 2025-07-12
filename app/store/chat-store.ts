import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  isGuest?: boolean
  guestToken?: string | null
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  imageBase64?: string
  imagePreview?: string
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

interface ChatState {
  sessions: ChatSession[]
  currentSessionId: string | null
  isLoading: boolean
  currentUser: User | null
  isGuest: boolean

  // Actions
  createSession: () => Promise<string>
  selectSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => Promise<void>
  addMessage: (sessionId: string, message: Omit<ChatMessage, 'timestamp'>) => Promise<void>
  updateMessage: (sessionId: string, messageIndex: number, newContent: string) => void
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>
  getCurrentSession: () => ChatSession | null
  clearSessions: () => void
  setLoading: (loading: boolean) => void
  loadSessions: () => Promise<void>
  setUser: (user: User | null) => void
  createGuestUser: () => Promise<User>
  setGuest: (isGuest: boolean) => void
}

const generateSessionTitle = (firstMessage: string): string => {
  const truncated = firstMessage.length > 30
    ? firstMessage.substring(0, 30) + '...'
    : firstMessage

  return truncated || '新しいチャット'
}

// データベースAPI呼び出し用の関数
const dbApi = {
  async createSession(title: string, userId: string): Promise<ChatSession> {
    const response = await fetch('/api/chat-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, userId })
    })
    return response.json()
  },

  async getSessions(userId: string): Promise<ChatSession[]> {
    const response = await fetch(`/api/chat-sessions?userId=${userId}`)
    return response.json()
  },

  async deleteSession(sessionId: string): Promise<void> {
    await fetch(`/api/chat-sessions/${sessionId}`, {
      method: 'DELETE'
    })
  },

  async addMessage(sessionId: string, message: ChatMessage): Promise<void> {
    await fetch(`/api/chat-sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })
  },

  async updateSession(sessionId: string, title: string): Promise<void> {
    await fetch(`/api/chat-sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    })
  }
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      isLoading: false,
      currentUser: null,
      isGuest: false,

      createSession: async () => {
        const state = get()
        if (!state.currentUser) {
          throw new Error('User not authenticated')
        }

        const newSessionId = `session-${Date.now()}`
        const title = '新しいチャット'

        // ローカルセッションを作成
        const newSession: ChatSession = {
          id: newSessionId,
          title,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        // ローカルに保存
        set(prevState => ({
          sessions: [newSession, ...prevState.sessions],
          currentSessionId: newSessionId
        }))

        // ゲストユーザーでもデータベースに保存するように変更
        try {
          const dbSession = await dbApi.createSession(title, state.currentUser.id)
          // データベースからのIDでローカルセッションを更新
          set(prevState => ({
            sessions: prevState.sessions.map(session =>
              session.id === newSessionId
                ? { ...session, id: dbSession.id }
                : session
            ),
            currentSessionId: dbSession.id
          }))
          console.log('Session saved to database successfully')
          return dbSession.id
        } catch (error) {
          console.error('Database create failed, using local storage only:', error)
          return newSessionId
        }
      },

      selectSession: (sessionId: string) => {
        set({ currentSessionId: sessionId })
      },

      deleteSession: async (sessionId: string) => {
        const state = get()

        // ローカルから削除
        set(state => ({
          sessions: state.sessions.filter(session => session.id !== sessionId),
          currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId
        }))

        // ゲストユーザーでもデータベースから削除するように変更
        try {
          await dbApi.deleteSession(sessionId)
          console.log('Session deleted from database successfully')
        } catch (error) {
          console.error('Database delete failed:', error)
        }
      },

      addMessage: async (sessionId: string, message: Omit<ChatMessage, 'timestamp'>) => {
        const state = get()
        const timestamp = new Date().toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        })

        const newMessage: ChatMessage = {
          ...message,
          timestamp
        }

        // ローカルに保存
        set(state => ({
          sessions: state.sessions.map(session => {
            if (session.id === sessionId) {
              const updatedMessages = [...(session.messages || []), newMessage]
              let updatedTitle = session.title

              if ((session.messages || []).length === 0 && message.role === 'user') {
                updatedTitle = generateSessionTitle(message.content)
              }

              return {
                ...session,
                messages: updatedMessages,
                title: updatedTitle,
                updatedAt: new Date().toISOString()
              }
            }
            return session
          })
        }))

        // ゲストユーザーでもデータベースに保存するように変更
        try {
          await dbApi.addMessage(sessionId, newMessage)
          console.log('Message saved to database successfully')
        } catch (error) {
          console.error('Database message save failed:', error)
        }
      },

      updateMessage: (sessionId: string, messageIndex: number, newContent: string) => {
        set(state => ({
          sessions: state.sessions.map(session => {
            if (session.id === sessionId) {
              const updatedMessages = session.messages.map((message, index) => {
                if (index === messageIndex) {
                  return {
                    ...message,
                    content: newContent,
                    timestamp: new Date().toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  }
                }
                return message
              })

              return {
                ...session,
                messages: updatedMessages,
                updatedAt: new Date().toISOString()
              }
            }
            return session
          })
        }))
      },

      updateSessionTitle: async (sessionId: string, title: string) => {
        // まずローカルストレージを更新
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? { ...session, title, updatedAt: new Date().toISOString() }
              : session
          )
        }))

        // バックグラウンドでデータベースを更新
        try {
          await dbApi.updateSession(sessionId, title)
          console.log('Session title updated in database successfully')
        } catch (error) {
          console.error('Database title update failed:', error)
        }
      },

      getCurrentSession: () => {
        const state = get()
        return state.sessions.find(session => session.id === state.currentSessionId) || null
      },

      clearSessions: () => {
        set({ sessions: [], currentSessionId: null })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      loadSessions: async () => {
        const state = get()
        if (!state.currentUser) {
          console.log('No user authenticated, skipping session load')
          return
        }

        // ゲストユーザーでもデータベースからロードするように変更
        try {
          const sessions = await dbApi.getSessions(state.currentUser.id)
          // データベースからのセッションにmessages配列があることを確認
          const validatedSessions = sessions.map(session => ({
            ...session,
            messages: session.messages || []
          }))
          // データベースからのデータでLocalStorageを上書き
          set({ sessions: validatedSessions })
          console.log('Sessions loaded from database:', validatedSessions.length)
        } catch (error) {
          console.error('Failed to load sessions from database:', error)
        }
      },

      setUser: (user: User | null) => {
        set({ currentUser: user })
      },

      createGuestUser: async () => {
        try {
          console.log('データベースゲストユーザー作成を開始')

          // データベースにゲストユーザーを作成
          const response = await fetch('/api/users/guest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })

          if (!response.ok) {
            throw new Error('Failed to create guest user in database')
          }

          const result = await response.json()
          if (!result.success) {
            throw new Error(result.error || 'Failed to create guest user')
          }

          const guestUser = result.user

          console.log('データベースゲストユーザーを作成:', guestUser)
          set({
            currentUser: guestUser,
            isGuest: true
          })
          console.log('ゲストユーザーがStoreに設定されました（データベース保存済み）')
          return guestUser
        } catch (error) {
          console.error('Failed to create database guest user:', error)
          throw error
        }
      },

      setGuest: (isGuest: boolean) => {
        set({ isGuest })
      }
    }),
    {
      name: 'chat-sessions',
      partialize: (state) => {
        // ゲストユーザーでもセッションを永続化するように変更
        return {
          sessions: state.sessions.map(session => ({
            ...session,
            messages: (session.messages || []).map(message => ({
              ...message,
              imageBase64: undefined, // 画像データは永続化しない
              imagePreview: undefined
            }))
          })),
          currentSessionId: state.currentSessionId,
          currentUser: state.currentUser,
          isGuest: state.isGuest
        }
      }
    }
  )
)