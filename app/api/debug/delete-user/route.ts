import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // ユーザーの存在確認
    const existingUser = await prisma.users.findUnique({
      where: { email }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // ユーザーの削除（カスケード削除によりセッションとメッセージも削除される）
    const deletedUser = await prisma.users.delete({
      where: { email }
    })

    console.log('User deleted:', deletedUser)

    return NextResponse.json({
      success: true,
      message: `User ${email} deleted successfully`,
      deletedUser: {
        id: deletedUser.id,
        email: deletedUser.email,
        name: deletedUser.name
      }
    })
  } catch (error) {
    console.error('Delete user error:', error)

    // Prisma固有のエラーハンドリング
    if (error instanceof Error) {
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to delete user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// 動的なレンダリングを強制
export const dynamic = 'force-dynamic'