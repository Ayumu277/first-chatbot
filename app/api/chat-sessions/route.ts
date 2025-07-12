import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../lib/prisma'

// GET: ユーザーのチャットセッション一覧を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      )
    }

    const sessions = await prisma.chatSession.findMany({
      where: {
        userId: userId
      },
      include: {
        messages: {
          orderBy: {
            timestamp: 'asc'
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Failed to fetch sessions:', error)
    return NextResponse.json(
      { error: 'セッションの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST: 新しいチャットセッションを作成
export async function POST(request: NextRequest) {
  try {
    const { title, userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      )
    }

    const newSession = await prisma.chatSession.create({
      data: {
        title: title || '新しいチャット',
        userId: userId
      }
    })

    return NextResponse.json(newSession)
  } catch (error) {
    console.error('Failed to create session:', error)
    return NextResponse.json(
      { error: 'セッションの作成に失敗しました' },
      { status: 500 }
    )
  }
}