import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type SessionWithMessages = {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: {
    id: string;
    role: string;
    content: string;
    timestamp: Date;
    imageBase64: string | null;
    imagePreview: string | null;
  }[];
}

// GET: 指定されたユーザーのセッションを取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
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

    // データベースの形式をフロントエンド用に変換
    const formattedSessions = sessions.map((session: SessionWithMessages) => ({
      id: session.id,
      title: session.title,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      messages: session.messages.map((msg: SessionWithMessages['messages'][0]) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        imageBase64: msg.imageBase64,
        imagePreview: msg.imagePreview
      }))
    }))

    return NextResponse.json(formattedSessions)
  } catch (error) {
    console.error('Failed to fetch sessions:', error)
    return NextResponse.json(
      { error: 'セッションの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST: 新しいセッションを作成
export async function POST(request: NextRequest) {
  try {
    const { title, userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const session = await prisma.chatSession.create({
      data: {
        title: title || '新しいチャット',
        userId: userId
      },
      include: {
        messages: true
      }
    })

    const formattedSession = {
      id: session.id,
      title: session.title,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      messages: []
    }

    return NextResponse.json(formattedSession)
  } catch (error) {
    console.error('Failed to create session:', error)
    return NextResponse.json(
      { error: 'セッションの作成に失敗しました' },
      { status: 500 }
    )
  }
}