import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 明示的なベースURL
const BASE_URL = process.env.NEXTAUTH_URL || 'https://chatbot-app-container-fse7g9cnf8hfgpej.japaneast-01.azurewebsites.net'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    console.log('📧 メール認証リクエスト受信:', { token: token?.substring(0, 10) + '...' })

    if (!token) {
      return NextResponse.redirect(`${BASE_URL}/?error=invalid_token`)
    }

    // トークンを検索
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token }
    })

    if (!verificationToken) {
      console.log('❌ 無効なトークン')
      return NextResponse.redirect(`${BASE_URL}/?error=invalid_token`)
    }

    // トークンの期限チェック
    if (verificationToken.expires < new Date()) {
      console.log('❌ 期限切れトークン')
      await prisma.emailVerificationToken.delete({
        where: { token }
      })
      return NextResponse.redirect(`${BASE_URL}/?error=expired_token`)
    }

    // 既に使用済みかチェック
    if (verificationToken.used) {
      console.log('❌ 使用済みトークン')
      return NextResponse.redirect(`${BASE_URL}/?error=already_used`)
    }

    // 既存ユーザーのチェック（念のため）
    const existingUser = await prisma.user.findUnique({
      where: { email: verificationToken.email }
    })

    if (existingUser) {
      console.log('⚠️ ユーザーが既に存在:', verificationToken.email)
      // トークンを削除
      await prisma.emailVerificationToken.delete({
        where: { token }
      })
      return NextResponse.redirect(`${BASE_URL}/?error=user_exists`)
    }

    // ユーザー作成
    const newUser = await prisma.user.create({
      data: {
        email: verificationToken.email,
        name: verificationToken.name,
        emailVerified: new Date(),
        isGuest: false
      }
    })

    // トークンを使用済みに更新
    await prisma.emailVerificationToken.update({
      where: { token },
      data: { used: true }
    })

    console.log('✅ ユーザー作成成功:', newUser.email)

    // 明示的なAzure URLにリダイレクト
    return NextResponse.redirect(`${BASE_URL}/?verified=true&email=${encodeURIComponent(newUser.email)}`)

  } catch (error) {
    console.error('❌ Email verification error:', error)
    return NextResponse.redirect(`${BASE_URL}/?error=verification_failed`)
  }
}

// 動的なレンダリングを強制
export const dynamic = 'force-dynamic'