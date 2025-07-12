import { NextRequest, NextResponse } from 'next/server'
import { prisma, testDatabaseConnection } from '../../../lib/prisma'
import { sendVerificationEmail } from '../../../lib/email'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    console.log('📧 メール登録APIが呼び出されました')

    // Prisma接続テスト
    console.log('🔍 Prisma接続テストを実行中...')
    const isConnected = await testDatabaseConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'データベース接続に失敗しました。しばらく後にお試しください。' },
        { status: 500 }
      )
    }

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

    console.log('🔍 既存ユーザーをチェック中...', email)

    // 既存ユーザーのチェック（認証済みユーザー）
    let existingUser
    try {
      existingUser = await prisma.users.findUnique({
        where: { email }
      })
      console.log('✅ 既存ユーザーチェック完了')
    } catch (dbError) {
      console.error('❌ データベースクエリエラー:', dbError)
      return NextResponse.json(
        {
          error: 'データベースアクセスでエラーが発生しました',
          details: dbError instanceof Error ? dbError.message : 'Unknown DB error'
        },
        { status: 500 }
      )
    }

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
      try {
        await prisma.users.delete({
          where: { email }
        })
        console.log('✅ 未認証ユーザー削除完了')
      } catch (deleteError) {
        console.error('❌ ユーザー削除エラー:', deleteError)
      }
    }

    // 認証トークンの生成
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date()
    expires.setHours(expires.getHours() + 24) // 24時間後に期限切れ

    console.log('🗑️ 既存の認証トークンを削除中...')

    // 既存の認証トークンを削除（同じメールアドレス）
    try {
      await prisma.email_verification_tokens.deleteMany({
        where: { email }
      })
      console.log('✅ 既存トークン削除完了')
    } catch (tokenDeleteError) {
      console.error('⚠️ 既存トークン削除エラー:', tokenDeleteError)
      // 削除エラーは致命的ではないので続行
    }

    console.log('🎫 新しい認証トークンを作成中...')

    // 新しい認証トークンを保存
    try {
      await prisma.email_verification_tokens.create({
        data: {
          email,
          name,
          token,
          expires
        }
      })
      console.log('✅ 認証トークン作成完了')
    } catch (tokenCreateError) {
      console.error('❌ 認証トークン作成エラー:', tokenCreateError)
      return NextResponse.json(
        {
          error: '認証トークンの作成に失敗しました',
          details: tokenCreateError instanceof Error ? tokenCreateError.message : 'Unknown token error'
        },
        { status: 500 }
      )
    }

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
      try {
        await prisma.emailVerificationToken.delete({
          where: { token }
        })
        console.log('✅ エラー時のトークン削除完了')
      } catch (cleanupError) {
        console.error('⚠️ エラー時のトークン削除に失敗:', cleanupError)
      }

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
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')

    let errorMessage = 'アカウント登録に失敗しました'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : '不明なエラー',
        type: error instanceof Error ? error.constructor.name : 'Unknown'
      },
      { status: 500 }
    )
  }
}