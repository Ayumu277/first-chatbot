import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// DELETE: セッションを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    await prisma.chatSession.delete({
      where: {
        id: params.sessionId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete session:', error)
    return NextResponse.json(
      { error: 'セッションの削除に失敗しました' },
      { status: 500 }
    )
  }
}

// PATCH: セッションのタイトルを更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { title } = await request.json()

    await prisma.chatSession.update({
      where: {
        id: params.sessionId
      },
      data: {
        title
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update session:', error)
    return NextResponse.json(
      { error: 'セッションの更新に失敗しました' },
      { status: 500 }
    )
  }
}