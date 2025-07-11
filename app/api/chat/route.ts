import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Chat API called')

    // API key のチェック
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not found')
      return NextResponse.json(
        { error: 'OpenAI APIキーが設定されていません' },
        { status: 500 }
      )
    }

    console.log('✅ OPENAI_API_KEY found:', process.env.OPENAI_API_KEY.substring(0, 20) + '...')

    // OpenAIクライアントをリクエスト時に初期化
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const { message, conversationHistory = [], imageBase64, imageMimeType } = await request.json()

    console.log('📨 Received message:', {
      messageLength: message?.length,
      historyLength: conversationHistory?.length,
      hasImage: !!imageBase64
    })

    if (!message) {
      return NextResponse.json(
        { error: 'メッセージが必要です' },
        { status: 400 }
      )
    }

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

    // OpenAI API呼び出し（画像がある場合はGPT-4 Vision使用）
    const completion = await openai.chat.completions.create({
      model: imageBase64 ? 'gpt-4o' : 'gpt-3.5-turbo',
      messages: messages as any,
      max_tokens: 1000,
      temperature: 0.7,
      stream: false,
    })

    console.log('✅ OpenAI API response received')

    const assistantMessage = completion.choices[0]?.message?.content

    if (!assistantMessage) {
      console.error('❌ No assistant message in response')
      return NextResponse.json(
        { error: 'AIからの応答を取得できませんでした' },
        { status: 500 }
      )
    }

    console.log('✅ Successfully generated response')

    return NextResponse.json({
      message: assistantMessage,
      success: true
    })

  } catch (error) {
    console.error('❌ Chat API error:', error)

    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 200)
      })

      // OpenAI API エラーの詳細表示
      if (error.message.includes('insufficient_quota')) {
        return NextResponse.json(
          { error: 'API利用制限に達しました。しばらく時間をおいて再試行してください。' },
          { status: 429 }
        )
      }

      if (error.message.includes('invalid_api_key')) {
        return NextResponse.json(
          { error: 'APIキーが無効です。設定を確認してください。' },
          { status: 401 }
        )
      }

      if (error.message.includes('rate_limit')) {
        return NextResponse.json(
          { error: 'レート制限に達しました。しばらく待ってから再試行してください。' },
          { status: 429 }
        )
      }

      // 一般的なネットワークエラー
      if (error.message.includes('timeout') || error.message.includes('network')) {
        return NextResponse.json(
          { error: 'ネットワークエラーが発生しました。再試行してください。' },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。詳細はログを確認してください。' },
      { status: 500 }
    )
  }
}