import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // ユーザーの削除（カスケード削除によりセッションとメッセージも削除される）
    const deletedUser = await prisma.user.delete({
      where: { email }
    })

    console.log('User deleted:', deletedUser)

    return NextResponse.json({
      success: true,
      message: `User ${email} deleted successfully`
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}

// 動的なレンダリングを強制
export const dynamic = 'force-dynamic'