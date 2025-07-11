import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendVerificationEmail } from '../../../lib/email'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json()

    // バリデーション
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
        { status: 409 }
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

    // 認証メールを送信
    const emailResult = await sendVerificationEmail(email, name, token)

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'メール送信に失敗しました。しばらく後にお試しください。' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '認証メールを送信しました。メールを確認してアカウント作成を完了してください。',
      email
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: '登録処理に失敗しました' },
      { status: 500 }
    )
  }
}