import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/?error=invalid_token', request.url))
    }

    // トークンを検索
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token }
    })

    if (!verificationToken) {
      return NextResponse.redirect(new URL('/?error=invalid_token', request.url))
    }

    // トークンの期限チェック
    if (verificationToken.expires < new Date()) {
      await prisma.emailVerificationToken.delete({
        where: { token }
      })
      return NextResponse.redirect(new URL('/?error=expired_token', request.url))
    }

    // 既に使用済みかチェック
    if (verificationToken.used) {
      return NextResponse.redirect(new URL('/?error=already_used', request.url))
    }

    // 既存ユーザーのチェック（念のため）
    const existingUser = await prisma.user.findUnique({
      where: { email: verificationToken.email }
    })

    if (existingUser) {
      // トークンを削除
      await prisma.emailVerificationToken.delete({
        where: { token }
      })
      return NextResponse.redirect(new URL('/?error=user_exists', request.url))
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

    console.log('✅ User created successfully:', newUser.email)

    // 登録完了ページにリダイレクト
    return NextResponse.redirect(new URL('/?verified=true', request.url))

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(new URL('/?error=verification_failed', request.url))
  }
}

// 動的なレンダリングを強制
export const dynamic = 'force-dynamic'