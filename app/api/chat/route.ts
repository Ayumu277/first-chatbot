import { NextRequest, NextResponse } from 'next/server'

// フォールバック応答の配列
const fallbackResponses = [
  'こんにちは！チャットボットです。今日はどのようなお手伝いができますか？',
  'ご質問ありがとうございます。現在、システムの調整中ですが、お手伝いできるよう最善を尽くします。',
  'お話しできて嬉しいです！何かご不明な点があればお気軽にお聞きください。',
  'チャットボットサービスをご利用いただき、ありがとうございます。どのようなことでお困りですか？',
  'こんにちは！今日の調子はいかがですか？何かお手伝いできることがあれば教えてください。'
]

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Chat API called')

    const { message, conversationHistory = [], imageBase64, imageMimeType } = await request.json()

    console.log('📨 Received message:', {
      messageLength: message?.length,
      historyLength: conversationHistory?.length,
      hasImage: !!imageBase64
    })

    if (!message) {
      return NextResponse.json({
        message: 'メッセージを入力してください。どのようなことでお手伝いできますか？',
        success: true,
        fallback: true
      })
    }

    // API key のチェック
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not found')
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
      return NextResponse.json({
        message: randomResponse,
        success: true,
        fallback: true
      })
    }

    console.log('✅ OpenAI API KEY found:', process.env.OPENAI_API_KEY.substring(0, 20) + '...')

    // 会話履歴を構築
    const messages = [
      {
        role: 'system',
        content: 'あなたは親切で知識豊富なAIアシスタントです。ユーザーの質問に丁寧に日本語で回答してください。'
      },
      ...conversationHistory,
      {
        role: 'user',
        content: imageBase64 ? [
          { type: 'text', text: message },
          {
            type: 'image_url',
            image_url: {
              url: `data:${imageMimeType || 'image/jpeg'};base64,${imageBase64}`
            }
          }
        ] : message
      }
    ]

    console.log('🔄 Calling OpenAI API...')

    // OpenAI API呼び出し (短めのタイムアウト設定)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15秒タイムアウト

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
          stream: false,
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('✅ OpenAI API response received, status:', response.status)

      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ OpenAI API error:', errorData)

        // API エラーでもフォールバック応答を返す
        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
        return NextResponse.json({
          message: randomResponse + ' (現在AIサービスの調整中です)',
          success: true,
          fallback: true
        })
      }

      const completion = await response.json()
      const assistantMessage = completion.choices[0]?.message?.content

      if (!assistantMessage) {
        console.error('❌ No assistant message in response')
        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
        return NextResponse.json({
          message: randomResponse,
          success: true,
          fallback: true
        })
      }

      console.log('✅ Successfully generated response')

      return NextResponse.json({
        message: assistantMessage,
        success: true
      })

    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }

  } catch (error) {
    console.error('❌ Chat API error:', error)

    // どんなエラーでも必ずフレンドリーなフォールバック応答を返す
    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]

    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message
      })

      // エラータイプに応じたメッセージの調整
      if (error.name === 'AbortError') {
        return NextResponse.json({
          message: randomResponse + ' (接続の調整中です)',
          success: true,
          fallback: true
        })
      }

      if (error.message.includes('insufficient_quota') || error.message.includes('rate_limit')) {
        return NextResponse.json({
          message: 'しばらく時間をおいて再度お試しください。' + randomResponse,
          success: true,
          fallback: true
        })
      }
    }

    // デフォルトのフォールバック応答
    return NextResponse.json({
      message: randomResponse,
      success: true,
      fallback: true
    })
  }
}