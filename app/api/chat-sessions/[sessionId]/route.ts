import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// DELETE: セッションを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params

    // まずメッセージを削除
    await prisma.chatMessage.deleteMany({
      where: {
        sessionId: sessionId
      }
    })

    // セッションを削除
    await prisma.chatSession.delete({
      where: {
        id: sessionId
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

// GET: セッションの詳細を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params

    const session = await prisma.chatSession.findUnique({
      where: {
        id: sessionId
      },
      include: {
        messages: {
          orderBy: {
            timestamp: 'asc'
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'セッションが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Failed to fetch session:', error)
    return NextResponse.json(
      { error: 'セッションの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PATCH: セッションのタイトルを更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const { title } = await request.json()

    await prisma.chatSession.update({
      where: {
        id: sessionId
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