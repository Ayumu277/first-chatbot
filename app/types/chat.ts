export interface UploadedImage {
  file: File
  base64: string
  preview: string
  mimeType: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  imageBase64?: string
  imagePreview?: string
}

export interface ChatSession {
  id: string
  title: string
  userId: string
  createdAt: string
  updatedAt: string
  messages: ChatMessage[]
}

export interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
  isGuest: boolean
}