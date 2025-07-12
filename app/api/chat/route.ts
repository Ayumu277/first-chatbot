import { NextRequest, NextResponse } from 'next/server'

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

    const { message, conversationHistory = [], imageBase64, imageMimeType } = await request.json()

    console.log('📨 Received message:', {
      messageLength: message?.length,
      historyLength: conversationHistory?.length,
      hasImage: !!imageBase64,
      timestamp: new Date().toISOString()
    })

    if (!message || !message.trim()) {
      return NextResponse.json({
        message: 'メッセージを入力してください。どのようなことでお手伝いできますか？',
        success: true,
        fallback: true
      })
    }

    // DeepSeek API keyのチェック
    if (!DEEPSEEK_API_KEY) {
      console.error('❌ DEEPSEEK_API_KEY not found')
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
      return NextResponse.json({
        message: randomResponse,
        success: true,
        fallback: true
      })
    }

    console.log('✅ DeepSeek API KEY found:', DEEPSEEK_API_KEY.substring(0, 20) + '...')

    // 会話履歴を構築（最新の10件のみ使用してコンテキストを管理）
    const recentHistory = conversationHistory.slice(-10)
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
      ...recentHistory,
      {
        role: 'user',
        content: message // 画像は現在サポートしていないため、テキストのみ
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
      return NextResponse.json({
        message: randomResponse,
        success: true,
        fallback: true
      })
    }

    const completion = await response.json()
    const assistantMessage = completion.choices[0]?.message?.content

    if (!assistantMessage) {
      console.error('❌ Empty response from DeepSeek API')
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
      return NextResponse.json({
        message: randomResponse,
        success: true,
        fallback: true
      })
    }

    console.log('✅ DeepSeek API response received:', {
      responseLength: assistantMessage.length,
      model: completion.model,
      usage: completion.usage
    })

    return NextResponse.json({
      message: assistantMessage,
      success: true,
      fallback: false,
      usage: completion.usage
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