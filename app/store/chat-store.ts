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

        // まずデータベースに保存してから、ローカルを更新
        try {
          await dbApi.addMessage(sessionId, newMessage)

          // データベース保存成功後にローカルを更新
          set(state => ({
            sessions: state.sessions.map(session => {
              if (session.id === sessionId) {
                // 重複チェック：同じ内容のメッセージが既に存在しないか確認
                const isDuplicate = session.messages.some(existingMsg =>
                  existingMsg.content === newMessage.content &&
                  existingMsg.role === newMessage.role &&
                  Math.abs(new Date(existingMsg.timestamp).getTime() - new Date().getTime()) < 5000 // 5秒以内
                )

                if (isDuplicate) {
                  return session
                }

                const updatedMessages = [...(session.messages || []), newMessage]
                let updatedTitle = session.title

                // 最初のユーザーメッセージでタイトルを更新
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

          // 最初のユーザーメッセージの場合、タイトルもデータベースで更新
          const session = state.sessions.find(s => s.id === sessionId)
          if (session && session.messages.length === 0 && message.role === 'user') {
            const newTitle = generateSessionTitle(message.content)
            await dbApi.updateSession(sessionId, newTitle)
          }
        } catch (error) {
          console.error('Database message save failed:', error)
          // データベース保存に失敗した場合のみローカルに保存
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
          return
        }

        try {
          const sessions = await dbApi.getSessions(state.currentUser.id)

          // データベースからのセッションをフロントエンド形式に変換
          const validatedSessions = sessions.map((session: any) => {
            // メッセージの重複を除去
            const uniqueMessages: ChatMessage[] = []
            const seenMessages = new Set() as Set<string>

            (session.chat_messages || []).forEach((msg: any) => {
              // メッセージの一意キーを作成（内容 + 役割 + 時間の組み合わせ）
              const messageKey = `${msg.content}-${msg.role}-${new Date(msg.timestamp).getTime()}`

              // 同じ内容で同じ役割のメッセージが5分以内にない場合のみ追加
              const hasSimilarRecent = uniqueMessages.some(existingMsg =>
                existingMsg.content === msg.content &&
                existingMsg.role === msg.role &&
                Math.abs(new Date(existingMsg.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 300000 // 5分
              )

              if (!seenMessages.has(messageKey) && !hasSimilarRecent) {
                seenMessages.add(messageKey)
                uniqueMessages.push({
                  role: msg.role as 'user' | 'assistant',
                  content: msg.content,
                  timestamp: new Date(msg.timestamp).toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit'
                  }),
                  imageBase64: msg.imageBase64 || undefined,
                  imagePreview: msg.imagePreview || undefined
                })
              }
            })

            return {
              id: session.id,
              title: session.title,
              createdAt: session.createdAt,
              updatedAt: session.updatedAt,
              messages: uniqueMessages
            }
          })

          // currentSessionIdの設定ロジック
          let newCurrentSessionId = state.currentSessionId

          // 現在選択されているセッションが存在するかチェック
          const currentSessionExists = state.currentSessionId &&
            validatedSessions.some(s => s.id === state.currentSessionId)

          // 現在のセッションが存在しない場合、最新のセッションを選択
          if (!currentSessionExists && validatedSessions.length > 0) {
            newCurrentSessionId = validatedSessions[0].id
          }

          // データベースからのデータで確実に更新
          set({
            sessions: validatedSessions,
            currentSessionId: newCurrentSessionId
          })

        } catch (error) {
          console.error('Failed to load sessions from database:', error)
        }
      },

      setUser: (user: User | null) => {
        set({ currentUser: user })
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