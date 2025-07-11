import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスが必要です' },
        { status: 400 }
      )
    }

    console.log('🗑️ ユーザー削除要求:', email)

    // 関連データを先に削除
    await prisma.account.deleteMany({
      where: {
        user: {
          email: email
        }
      }
    })

    await prisma.session.deleteMany({
      where: {
        user: {
          email: email
        }
      }
    })

    await prisma.chatMessage.deleteMany({
      where: {
        session: {
          user: {
            email: email
          }
        }
      }
    })

    await prisma.chatSession.deleteMany({
      where: {
        user: {
          email: email
        }
      }
    })

    // メール認証トークンも削除
    await prisma.emailVerificationToken.deleteMany({
      where: {
        email: email
      }
    })

    // ユーザー削除
    const deletedUser = await prisma.user.delete({
      where: {
        email: email
      }
    })

    console.log('✅ ユーザーが削除されました:', deletedUser.email)

    return NextResponse.json({
      success: true,
      message: `ユーザー ${email} が正常に削除されました`,
      deletedUser: {
        id: deletedUser.id,
        email: deletedUser.email,
        name: deletedUser.name
      }
    })

  } catch (error: any) {
    console.error('❌ ユーザー削除エラー:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: '指定されたユーザーが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: 'ユーザー削除に失敗しました',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// 動的なレンダリングを強制
export const dynamic = 'force-dynamic'