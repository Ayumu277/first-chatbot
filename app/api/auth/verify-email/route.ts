import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// 明示的なベースURL
const BASE_URL = process.env.NEXTAUTH_URL || 'https://chatbot-app-container-fse7g9cnf8hfgpej.japaneast-01.azurewebsites.net'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    console.log('📧 メール認証リクエスト受信:', {
      token: token?.substring(0, 10) + '...',
      fullToken: token,
      baseUrl: BASE_URL,
      url: request.url
    })

    if (!token) {
      console.log('❌ トークンが見つかりません')
      return NextResponse.redirect(`${BASE_URL}/?error=invalid_token`)
    }

    // データベース接続テスト
    console.log('🔍 データベース接続テスト開始')

    // トークンを検索
    console.log('🔍 トークンを検索中:', token)
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token }
    })

    console.log('🔍 トークン検索結果:', verificationToken ? 'Found' : 'Not found')

    if (!verificationToken) {
      console.log('❌ 無効なトークン - データベースに存在しません')
      return NextResponse.redirect(`${BASE_URL}/?error=invalid_token`)
    }

    // トークンの期限チェック
    const now = new Date()
    console.log('🔍 時間比較:', {
      now: now.toISOString(),
      expires: verificationToken.expires.toISOString(),
      isExpired: verificationToken.expires < now
    })

    if (verificationToken.expires < now) {
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
    console.log('🔍 既存ユーザーチェック:', verificationToken.email)
    const existingUser = await prisma.user.findUnique({
      where: { email: verificationToken.email }
    })

    console.log('🔍 既存ユーザー検索結果:', existingUser ? 'Found' : 'Not found')

    if (existingUser) {
      console.log('⚠️ ユーザーが既に存在:', verificationToken.email)
      // トークンを削除
      await prisma.emailVerificationToken.delete({
        where: { token }
      })
      return NextResponse.redirect(`${BASE_URL}/?error=user_exists`)
    }

    // ユーザー作成
    console.log('👤 ユーザー作成開始:', {
      email: verificationToken.email,
      name: verificationToken.name
    })

    const newUser = await prisma.user.create({
      data: {
        email: verificationToken.email,
        name: verificationToken.name,
        emailVerified: new Date(),
        isGuest: false
      }
    })

    console.log('✅ ユーザー作成成功:', {
      id: newUser.id,
      email: newUser.email
    })

    // トークンを使用済みに更新
    console.log('🔄 トークンを使用済みに更新')
    await prisma.emailVerificationToken.update({
      where: { token },
      data: { used: true }
    })

    console.log('✅ メール認証完了:', newUser.email)

    // 成功時のリダイレクト
    const redirectUrl = `${BASE_URL}/?verified=true&email=${encodeURIComponent(newUser.email)}`
    console.log('🔄 リダイレクト先:', redirectUrl)

    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error('❌ Email verification error:', error)
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })

    return NextResponse.redirect(`${BASE_URL}/?error=verification_failed`)
  }
}

// 動的なレンダリングを強制
export const dynamic = 'force-dynamic'