import { NextRequest, NextResponse } from 'next/server'
import prisma, { checkDatabaseConnection } from '../../../lib/prisma'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    console.log('👤 ユーザー登録APIが呼び出されました')

    // Prisma接続テスト
    console.log('🔍 Prisma接続テストを実行中...')
    const isConnected = await checkDatabaseConnection()
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

    // 既存ユーザーのチェック
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

    if (existingUser) {
      console.log('⚠️ 既に登録済みのユーザー:', email)
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      )
    }

    // 新しいユーザーを直接作成（メール認証なし）
    console.log('👤 新しいユーザーを作成中...')
    try {
      const userId = crypto.randomUUID()
      const newUser = await prisma.users.create({
        data: {
          id: userId,
          name,
          email,
          emailVerified: new Date(), // 即座に認証済みとして設定
          image: null,
          password: null,
          updatedAt: new Date()
        }
      })

      console.log('✅ ユーザー作成完了:', {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      })

      return NextResponse.json({
        success: true,
        message: 'アカウントの登録が完了しました！',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name
        }
      })
    } catch (createError) {
      console.error('❌ ユーザー作成エラー:', createError)
      return NextResponse.json(
        {
          error: 'ユーザーの作成に失敗しました',
          details: createError instanceof Error ? createError.message : 'Unknown creation error'
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