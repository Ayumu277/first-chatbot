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
    await prisma.chat_messages.deleteMany({
      where: {
        sessionId: sessionId
      }
    })

    // セッションを削除
    await prisma.chat_sessions.delete({
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

// PATCH: セッションのタイトルを更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const { title } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: 'タイトルが必要です' },
        { status: 400 }
      )
    }

    const updatedSession = await prisma.chat_sessions.update({
      where: {
        id: sessionId
      },
      data: {
        title: title,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error('Failed to update session:', error)
    return NextResponse.json(
      { error: 'セッションの更新に失敗しました' },
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

    const session = await prisma.chat_sessions.findUnique({
      where: {
        id: sessionId
      },
      include: {
        chat_messages: {
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