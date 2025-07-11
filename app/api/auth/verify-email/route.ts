import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=invalid_token`)
    }

    // トークンを検索
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token }
    })

    if (!verificationToken) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=invalid_token`)
    }

    // トークンの期限チェック
    if (verificationToken.expires < new Date()) {
      await prisma.emailVerificationToken.delete({
        where: { token }
      })
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=expired_token`)
    }

    // 既に使用済みかチェック
    if (verificationToken.used) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=already_used`)
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
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=user_exists`)
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
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?success=registration_complete`)

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=verification_failed`)
  }
}