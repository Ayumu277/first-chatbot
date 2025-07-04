import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
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

  // Actions
  createSession: () => string
  selectSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  addMessage: (sessionId: string, message: Omit<ChatMessage, 'timestamp'>) => void
  updateMessage: (sessionId: string, messageIndex: number, newContent: string) => void
  updateSessionTitle: (sessionId: string, title: string) => void
  getCurrentSession: () => ChatSession | null
  clearSessions: () => void
  setLoading: (loading: boolean) => void
}

const generateSessionTitle = (firstMessage: string): string => {
  // 最初のメッセージから適切なタイトルを生成
  const truncated = firstMessage.length > 30
    ? firstMessage.substring(0, 30) + '...'
    : firstMessage

  return truncated || '新しいチャット'
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      isLoading: false,

      createSession: () => {
        const newSessionId = `session-${Date.now()}`
        const newSession: ChatSession = {
          id: newSessionId,
          title: '新しいチャット',
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        set(state => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: newSessionId
        }))

        return newSessionId
      },

      selectSession: (sessionId: string) => {
        set({ currentSessionId: sessionId })
      },

      deleteSession: (sessionId: string) => {
        set(state => ({
          sessions: state.sessions.filter(session => session.id !== sessionId),
          currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId
        }))
      },

            addMessage: (sessionId: string, message: Omit<ChatMessage, 'timestamp'>) => {
        const timestamp = new Date().toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        })

        const newMessage: ChatMessage = {
          ...message,
          timestamp
        }

        set(state => ({
          sessions: state.sessions.map(session => {
            if (session.id === sessionId) {
              const updatedMessages = [...session.messages, newMessage]
              let updatedTitle = session.title

              // 最初のユーザーメッセージの場合、タイトルを自動生成
              if (session.messages.length === 0 && message.role === 'user') {
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

      updateSessionTitle: (sessionId: string, title: string) => {
        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? { ...session, title, updatedAt: new Date().toISOString() }
              : session
          )
        }))
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
      }
    }),
    {
      name: 'chat-sessions', // localStorage key
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId
      })
    }
  )
)