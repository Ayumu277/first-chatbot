import { NextRequest, NextResponse } from 'next/server'
import { sendTestEmail } from '../../../lib/email'

export async function POST(request: NextRequest) {
  try {
    console.log('📧 テストメール送信APIが呼び出されました')

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスは必須です' },
        { status: 400 }
      )
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      )
    }

    console.log('📧 テストメール送信開始:', email)

    // テストメール送信
    const result = await sendTestEmail(email)

    if (result.success) {
      console.log('✅ テストメール送信成功:', email)
      return NextResponse.json({
        success: true,
        message: 'テストメールが正常に送信されました',
        email,
        emailId: result.data?.id
      })
    } else {
      console.error('❌ テストメール送信失敗:', result.error)
      return NextResponse.json(
        {
          error: 'テストメール送信に失敗しました',
          details: result.error
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Test email API error:', error)
    return NextResponse.json(
      {
        error: 'テストメール送信に失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
}