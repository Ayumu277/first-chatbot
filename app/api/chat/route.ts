import { NextRequest, NextResponse } from 'next/server'

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

    console.log('✅ OpenAI API KEY found:', process.env.OPENAI_API_KEY.substring(0, 20) + '...')

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

    // OpenAI API呼び出し (タイムアウト設定を追加)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒タイムアウト

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
        return NextResponse.json({
          message: 'すみません、現在AIサービスに接続できません。しばらく時間をおいて再度お試しください。',
          success: true,
          fallback: true
        })
      }

      const completion = await response.json()
      const assistantMessage = completion.choices[0]?.message?.content

      if (!assistantMessage) {
        console.error('❌ No assistant message in response')
        return NextResponse.json({
          message: 'すみません、応答の生成に失敗しました。もう一度お試しください。',
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

    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 200)
      })

      // タイムアウトエラー
      if (error.name === 'AbortError') {
        return NextResponse.json({
          message: 'リクエストがタイムアウトしました。ネットワーク接続を確認して再度お試しください。',
          success: true,
          fallback: true
        })
      }

      // API エラーの詳細表示
      if (error.message.includes('insufficient_quota')) {
        return NextResponse.json({
          message: 'API利用制限に達しました。しばらく時間をおいて再試行してください。',
          success: true,
          fallback: true
        })
      }

      if (error.message.includes('invalid_api_key')) {
        return NextResponse.json({
          message: 'APIキーの設定に問題があります。管理者に連絡してください。',
          success: true,
          fallback: true
        })
      }

      if (error.message.includes('rate_limit')) {
        return NextResponse.json({
          message: 'レート制限に達しました。しばらく待ってから再試行してください。',
          success: true,
          fallback: true
        })
      }

      // 一般的なネットワークエラー
      if (error.message.includes('timeout') || error.message.includes('network') || error.message.includes('fetch')) {
        return NextResponse.json({
          message: 'ネットワークエラーが発生しました。接続を確認して再試行してください。',
          success: true,
          fallback: true
        })
      }
    }

    // フォールバック応答で確実にHTTP 200を返す
    return NextResponse.json({
      message: 'チャットボットサービスは現在メンテナンス中です。ご不便をおかけして申し訳ございません。',
      success: true,
      fallback: true
    })
  }
}