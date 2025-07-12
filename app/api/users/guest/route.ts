import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// 共通ゲストユーザーのID
const SHARED_GUEST_USER_ID = 'shared_guest_user'
const SHARED_GUEST_TOKEN = 'shared_guest_token'

// 共通ゲストユーザーを作成または取得
export async function POST() {
  try {
    console.log('ゲストユーザー作成APIが呼び出されました')

    // 共通のゲストユーザーが存在するかチェック
    let guestUser = await prisma.users.findUnique({
      where: {
        id: SHARED_GUEST_USER_ID
      }
    })

    if (!guestUser) {
      console.log('共通ゲストユーザーを新規作成します')

      // 共通ゲストユーザーを作成
      guestUser = await prisma.users.create({
        data: {
          id: SHARED_GUEST_USER_ID,
          name: 'ゲストユーザー',
          isGuest: true,
          guestToken: SHARED_GUEST_TOKEN,
          updatedAt: new Date()
        }
      })
      console.log('共通ゲストユーザーが作成されました:', guestUser)
    } else {
      console.log('既存の共通ゲストユーザーを使用します:', guestUser)
    }

    const response = {
      success: true,
      user: {
        id: guestUser.id,
        name: guestUser.name,
        isGuest: guestUser.isGuest,
        guestToken: guestUser.guestToken
      }
    }
    console.log('API応答:', response)

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
    console.log('ゲストユーザー復元APIが呼び出されました')

    // Authorization ヘッダーからトークンを取得
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('認証ヘッダーが見つかりません')
      return NextResponse.json(
        { success: false, error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const guestToken = authHeader.substring(7) // "Bearer " を削除
    console.log('ゲストトークン:', guestToken)

    // 共通ゲストトークンの場合
    if (guestToken === SHARED_GUEST_TOKEN) {
      const guestUser = await prisma.users.findUnique({
        where: {
          id: SHARED_GUEST_USER_ID
        }
      })

      if (guestUser) {
        console.log('共通ゲストユーザーが見つかりました:', guestUser)

        const response = {
          success: true,
          user: {
            id: guestUser.id,
            name: guestUser.name,
            isGuest: guestUser.isGuest,
            guestToken: guestUser.guestToken
          }
        }
        console.log('API応答:', response)

        return NextResponse.json(response)
      }
    }

    console.log('ゲストユーザーが見つかりません')
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