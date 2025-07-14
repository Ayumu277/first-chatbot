import { NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'

// 共通ゲストユーザーのID
const SHARED_GUEST_USER_ID = 'shared_guest_user'
const SHARED_GUEST_TOKEN = 'shared_guest_token'

// 共通ゲストユーザーを作成または取得
export async function POST() {
  try {

    // まず、既存の古いゲストユーザーをクリーンアップ
    try {
      const deletedCount = await prisma.users.deleteMany({
        where: {
          isGuest: true,
          NOT: {
            id: SHARED_GUEST_USER_ID
          }
        }
      })
    } catch (cleanupError) {
      console.warn('ゲストユーザークリーンアップ中にエラー:', cleanupError)
    }

    // upsert操作で共通ゲストユーザーを作成または取得
    const guestUser = await prisma.users.upsert({
      where: {
        id: SHARED_GUEST_USER_ID
      },
      update: {
        // 既存の場合は何も更新しない（そのまま使用）
        updatedAt: new Date()
      },
      create: {
        id: SHARED_GUEST_USER_ID,
        name: 'ゲストユーザー',
        email: null,
        isGuest: true,
        guestToken: SHARED_GUEST_TOKEN,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })


    const response = {
      success: true,
      user: {
        id: guestUser.id,
        name: guestUser.name,
        isGuest: guestUser.isGuest,
        guestToken: guestUser.guestToken
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to create guest user:', error)

    // より詳細なエラー情報を提供
    let errorMessage = 'ゲストユーザーの作成に失敗しました'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
}

// 共通ゲストユーザーを復元
export async function GET(request: Request) {
  try {

    // Authorization ヘッダーからトークンを取得
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const guestToken = authHeader.substring(7) // "Bearer " を削除

    // 共通ゲストトークンの場合
    if (guestToken === SHARED_GUEST_TOKEN) {
      const guestUser = await prisma.users.findUnique({
        where: {
          id: SHARED_GUEST_USER_ID
        }
      })

      if (guestUser) {

        const response = {
          success: true,
          user: {
            id: guestUser.id,
            name: guestUser.name,
            isGuest: guestUser.isGuest,
            guestToken: guestUser.guestToken
          }
        }

        return NextResponse.json(response)
      }
    }

    return NextResponse.json(
      { success: false, error: 'Guest user not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Failed to restore guest user:', error)

    let errorMessage = 'ゲストユーザーの復元に失敗しました'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    )
  }
}