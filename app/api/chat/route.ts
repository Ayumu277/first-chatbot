import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../lib/prisma'

// フォールバック応答の配列
const fallbackResponses = [
  'こんにちは！AIチャットボットです。今日はどのようなお手伝いができますか？🤖',
  'ご質問ありがとうございます。現在、AIサービスが一時的に利用できませんが、お答えできるよう最善を尽くします。',
  'お話しできて嬉しいです！何かご不明な点があればお気軽にお聞きください。✨',
  'チャットボットサービスをご利用いただき、ありがとうございます。どのようなことでお困りですか？',
  'こんにちは！今日の調子はいかがですか？何かお手伝いできることがあれば教えてください。😊'
]

// DeepSeek APIクライアントの設定
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Chat API called')

    const {
      message,
      conversationHistory = [],
      imageBase64,
      imageMimeType,
      userId,
      sessionId
    } = await request.json()

    console.log('📨 Received message:', {
      messageLength: message?.length,
      historyLength: conversationHistory?.length,
      hasImage: !!imageBase64,
      userId,
      sessionId,
      timestamp: new Date().toISOString()
    })

    if (!message || !message.trim()) {
      return NextResponse.json({
        message: 'メッセージを入力してください。どのようなことでお手伝いできますか？',
        success: true,
        fallback: true
      })
    }

    if (!userId) {
      return NextResponse.json({
        message: 'ユーザーIDが必要です。',
        success: false,
        error: 'USER_ID_REQUIRED'
      }, { status: 400 })
    }

    // セッションの確認・作成
    let currentSessionId = sessionId
    if (!currentSessionId) {
      // 新しいセッションを作成
      currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      console.log('🆕 Creating new session:', currentSessionId)

      try {
        await prisma.chat_sessions.create({
          data: {
            id: currentSessionId,
            title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
            userId: userId,
            updatedAt: new Date()
          }
        })
      } catch (error) {
        console.error('❌ Failed to create session:', error)
        return NextResponse.json({
          message: 'セッションの作成に失敗しました。',
          success: false,
          error: 'SESSION_CREATE_FAILED'
        }, { status: 500 })
      }
    }

    // ユーザーメッセージをデータベースに保存
    const userMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    try {
      await prisma.chat_messages.create({
        data: {
          id: userMessageId,
          sessionId: currentSessionId,
          role: 'user',
          content: message,
          imageBase64: imageBase64 || null,
          imagePreview: imageMimeType || null
        }
      })
      console.log('✅ User message saved to database')
    } catch (error) {
      console.error('❌ Failed to save user message:', error)
      // エラーがあってもチャットは続行
    }

    // DeepSeek API keyのチェック
    if (!DEEPSEEK_API_KEY) {
      console.error('❌ DEEPSEEK_API_KEY not found')
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]

      // AIメッセージもデータベースに保存
      try {
        await prisma.chat_messages.create({
          data: {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sessionId: currentSessionId,
            role: 'assistant',
            content: randomResponse
          }
        })
      } catch (error) {
        console.error('❌ Failed to save AI message:', error)
      }

      return NextResponse.json({
        message: randomResponse,
        success: true,
        fallback: true,
        sessionId: currentSessionId
      })
    }

    console.log('✅ DeepSeek API KEY found:', DEEPSEEK_API_KEY.substring(0, 20) + '...')

    // 会話履歴を構築（データベースから取得）
    let recentHistory = conversationHistory
    if (conversationHistory.length === 0) {
      try {
        const dbMessages = await prisma.chat_messages.findMany({
          where: {
            sessionId: currentSessionId
          },
          orderBy: {
            timestamp: 'asc'
          },
          take: 20 // 最新20件を取得
        })

        recentHistory = dbMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      } catch (error) {
        console.error('❌ Failed to fetch chat history:', error)
        recentHistory = []
      }
    }

    // 最新の10件のみ使用してコンテキストを管理
    const messages = [
      {
        role: 'system',
        content: `あなたは親切で知識豊富なAIアシスタントです。以下のガイドラインに従って日本語で回答してください：

1. 丁寧で親しみやすい口調で回答する
2. 質問に対して具体的で役立つ情報を提供する
3. 不明な点がある場合は、「わからない」と正直に答える
4. 危険な行為や違法行為に関する質問には適切に対処する
5. 適切な絵文字を使用して親しみやすさを演出する

現在の日時: ${new Date().toLocaleString('ja-JP')}
`
      },
      ...recentHistory.slice(-10),
      {
        role: 'user',
        content: message
      }
    ]

    console.log('🤖 Sending request to DeepSeek API with', messages.length, 'messages')

    // DeepSeek API呼び出し
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ DeepSeek API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })

      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]

      // AIメッセージもデータベースに保存
      try {
        await prisma.chat_messages.create({
          data: {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sessionId: currentSessionId,
            role: 'assistant',
            content: randomResponse
          }
        })
      } catch (error) {
        console.error('❌ Failed to save AI message:', error)
      }

      return NextResponse.json({
        message: randomResponse,
        success: true,
        fallback: true,
        sessionId: currentSessionId
      })
    }

    const completion = await response.json()
    const assistantMessage = completion.choices[0]?.message?.content

    if (!assistantMessage) {
      console.error('❌ Empty response from DeepSeek API')
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]

      // AIメッセージもデータベースに保存
      try {
        await prisma.chat_messages.create({
          data: {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sessionId: currentSessionId,
            role: 'assistant',
            content: randomResponse
          }
        })
      } catch (error) {
        console.error('❌ Failed to save AI message:', error)
      }

      return NextResponse.json({
        message: randomResponse,
        success: true,
        fallback: true,
        sessionId: currentSessionId
      })
    }

    console.log('✅ DeepSeek API response received:', {
      responseLength: assistantMessage.length,
      model: completion.model,
      usage: completion.usage
    })

    // AIメッセージをデータベースに保存
    const aiMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    try {
      await prisma.chat_messages.create({
        data: {
          id: aiMessageId,
          sessionId: currentSessionId,
          role: 'assistant',
          content: assistantMessage
        }
      })
      console.log('✅ AI message saved to database')
    } catch (error) {
      console.error('❌ Failed to save AI message:', error)
      // エラーがあってもレスポンスは返す
    }

    // セッションの更新日時を更新
    try {
      await prisma.chat_sessions.update({
        where: {
          id: currentSessionId
        },
        data: {
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('❌ Failed to update session:', error)
    }

    return NextResponse.json({
      message: assistantMessage,
      success: true,
      fallback: false,
      usage: completion.usage,
      sessionId: currentSessionId
    })

  } catch (error) {
    console.error('❌ Chat API error:', error)

    // DeepSeek API固有のエラーをチェック
    if (error instanceof Error) {
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        return NextResponse.json({
          message: '申し訳ございません。現在AIサービスの利用制限に達しています。しばらく時間をおいてからお試しください。',
          success: true,
          fallback: true
        })
      }

      if (error.message.includes('invalid_api_key') || error.message.includes('unauthorized')) {
        console.error('❌ Invalid DeepSeek API key')
        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
        return NextResponse.json({
          message: randomResponse,
          success: true,
          fallback: true
        })
      }
    }

    // 汎用的なエラーハンドリング
    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
    return NextResponse.json({
      message: randomResponse,
      success: true,
      fallback: true
    })
  }
}