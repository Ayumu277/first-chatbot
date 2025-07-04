'use client'

import { useState } from 'react'
import { PaperAirplaneIcon, PaperClipIcon } from '@heroicons/react/24/outline'
import { UserIcon, CpuChipIcon } from '@heroicons/react/24/solid'

interface ChatWindowProps {
  chatId: string | null
}

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: string
}

// ダミーメッセージデータ
const mockMessages: Record<string, Message[]> = {
  'chat-1': [
    {
      id: 'msg-1',
      content: 'React開発でuseEffectの使い方について教えてください。',
      sender: 'user',
      timestamp: '10:30'
    },
    {
      id: 'msg-2',
      content: 'useEffectは副作用を扱うためのReactフックです。コンポーネントのレンダリング後に実行される処理を記述できます。\n\n基本的な使い方:\n```javascript\nuseEffect(() => {\n  // 副作用の処理\n}, [dependencies]);\n```\n\n第二引数の依存配列によって実行タイミングを制御できます。',
      sender: 'ai',
      timestamp: '10:31'
    },
    {
      id: 'msg-3',
      content: 'ありがとうございます！依存配列が空の場合はどうなりますか？',
      sender: 'user',
      timestamp: '10:32'
    },
    {
      id: 'msg-4',
      content: '依存配列が空の場合（`[]`）、useEffectはコンポーネントのマウント時に一度だけ実行されます。これは `componentDidMount` と同じ動作です。\n\n```javascript\nuseEffect(() => {\n  // マウント時に一度だけ実行\n  console.log("Component mounted");\n}, []); // 空の依存配列\n```\n\nこの場合、コンポーネントが再レンダリングされても、useEffect内の処理は実行されません。',
      sender: 'ai',
      timestamp: '10:33'
    }
  ],
  'chat-2': [
    {
      id: 'msg-5',
      content: 'TypeScriptでtsconfig.jsonの設定について教えてください。',
      sender: 'user',
      timestamp: '09:15'
    },
    {
      id: 'msg-6',
      content: 'tsconfig.jsonはTypeScriptプロジェクトの設定ファイルです。コンパイラオプション、ファイルの包含・除外、型チェックの厳格さなどを設定できます。\n\n基本的な設定例:\n```json\n{\n  "compilerOptions": {\n    "target": "es5",\n    "lib": ["dom", "dom.iterable", "esnext"],\n    "allowJs": true,\n    "skipLibCheck": true,\n    "strict": true,\n    "forceConsistentCasingInFileNames": true,\n    "noEmit": true,\n    "esModuleInterop": true,\n    "module": "esnext",\n    "moduleResolution": "node",\n    "resolveJsonModule": true,\n    "isolatedModules": true,\n    "jsx": "preserve"\n  },\n  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],\n  "exclude": ["node_modules"]\n}\n```',
      sender: 'ai',
      timestamp: '09:16'
    }
  ]
}

export default function ChatWindow({ chatId }: ChatWindowProps) {
  const [inputMessage, setInputMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>(chatId ? mockMessages[chatId] || [] : [])

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !chatId) return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: inputMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    }

    setMessages([...messages, newMessage])
    setInputMessage('')

    // AIの応答をシミュレート
    setTimeout(() => {
      const aiResponse: Message = {
        id: `msg-${Date.now()}-ai`,
        content: 'これはAIの応答のダミーテキストです。実際のAI機能は後で実装します。',
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!chatId) {
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
        <h1 className="text-lg font-semibold text-white text-center md:text-left">チャット</h1>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-6 md:px-4 py-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-300 text-sm sm:text-base font-medium">まだメッセージがありません。最初のメッセージを送信してください。</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-[#1E90FF] flex items-center justify-center flex-shrink-0">
                    <CpuChipIcon className="w-5 h-5 text-white" />
                  </div>
                )}
                                  <div
                  className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] px-4 py-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-[#1E90FF] text-white'
                      : 'bg-[#161B22] text-white border border-gray-700'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words text-sm sm:text-base font-normal leading-relaxed">
                    {message.content}
                  </div>
                  <div className="text-xs mt-2 opacity-70 font-medium">
                    {message.timestamp}
                  </div>
                </div>
                {message.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
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
            disabled={!inputMessage.trim()}
            className="p-2 text-[#1E90FF] hover:text-blue-400 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}