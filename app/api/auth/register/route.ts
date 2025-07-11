import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { sendVerificationEmail } from '../../../lib/email'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('📧 メール登録APIが呼び出されました')

    const { name, email } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: '名前とメールアドレスは必須です' },
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

    // 既存ユーザーのチェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      )
    }

    // 認証トークンの生成
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date()
    expires.setHours(expires.getHours() + 24) // 24時間後に期限切れ

    // 既存の認証トークンを削除（同じメールアドレス）
    await prisma.emailVerificationToken.deleteMany({
      where: { email }
    })

    // 新しい認証トークンを保存
    await prisma.emailVerificationToken.create({
      data: {
        email,
        name,
        token,
        expires
      }
    })

    console.log('認証トークンが作成されました:', token)

    // 確認メール送信
    try {
      await sendVerificationEmail(email, name, token)
      console.log('確認メールが送信されました')
    } catch (emailError) {
      console.error('確認メール送信エラー:', emailError)
      return NextResponse.json(
        { error: 'メール送信に失敗しました。しばらく後にお試しください。' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '登録が完了しました！確認メールをお送りしましたので、メールボックスをご確認ください。',
      email
    })

  } catch (error) {
    console.error('Registration error:', error)

    let errorMessage = 'アカウント登録に失敗しました'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
}