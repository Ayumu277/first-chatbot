import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { sendVerificationEmail } from '../../../lib/email'
import crypto from 'crypto'

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

    // 既存ユーザーのチェック（認証済みユーザー）
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser && existingUser.emailVerified) {
      console.log('⚠️ 既に認証済みのユーザー:', email)
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      )
    }

    // 未認証のユーザーがいる場合、削除して再登録を許可
    if (existingUser && !existingUser.emailVerified) {
      console.log('🔄 未認証ユーザーを削除して再登録を許可:', email)
      await prisma.user.delete({
        where: { email }
      })
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

    console.log('✅ 認証トークンが作成されました:', {
      email,
      token: token.substring(0, 10) + '...',
      expires: expires.toISOString()
    })

    // 確認メール送信
    try {
      await sendVerificationEmail(email, name, token)
      console.log('✅ 確認メールが送信されました:', email)

      return NextResponse.json({
        success: true,
        message: '登録が完了しました！確認メールをお送りしましたので、メールボックスをご確認ください。',
        email,
        debug: {
          tokenCreated: true,
          emailSent: true,
          verificationUrl: `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`
        }
      })
    } catch (emailError) {
      console.error('❌ 確認メール送信エラー:', emailError)

      // メール送信に失敗した場合、作成したトークンを削除
      await prisma.emailVerificationToken.delete({
        where: { token }
      })

      return NextResponse.json(
        {
          error: 'メール送信に失敗しました。しばらく後にお試しください。',
          details: emailError instanceof Error ? emailError.message : 'メール送信エラー'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Registration error:', error)

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