import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST: セッションにメッセージを追加
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const message = await request.json()

    await prisma.chatMessage.create({
      data: {
        sessionId: params.sessionId,
        role: message.role,
        content: message.content,
        imageBase64: message.imageBase64,
        imagePreview: message.imagePreview
      }
    })

    // セッションの更新日時を更新
    await prisma.chatSession.update({
      where: {
        id: params.sessionId
      },
      data: {
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to add message:', error)
    return NextResponse.json(
      { error: 'メッセージの追加に失敗しました' },
      { status: 500 }
    )
  }
}