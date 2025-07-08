import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    // OpenAIクライアントをリクエスト時に初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

    const { message, conversationHistory = [], imageBase64, imageMimeType } = await request.json()

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

    // OpenAI API呼び出し（画像がある場合はGPT-4 Vision使用）
    const completion = await openai.chat.completions.create({
      model: imageBase64 ? 'gpt-4o' : 'gpt-3.5-turbo',
      messages: messages as any,
      max_tokens: 1000,
      temperature: 0.7,
      stream: false,
    })

    const assistantMessage = completion.choices[0]?.message?.content

    if (!assistantMessage) {
      return NextResponse.json(
        { error: 'AIからの応答を取得できませんでした' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: assistantMessage,
      success: true
    })

  } catch (error) {
    console.error('Chat API error:', error)

    if (error instanceof Error) {
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
    }

    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}