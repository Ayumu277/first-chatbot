import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// ゲストユーザーを作成または取得
export async function POST() {
  try {
    console.log('ゲストユーザー作成APIが呼び出されました')

    // 新しいゲストユーザーを作成
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substr(2, 9)
    const guestToken = `guest_${timestamp}_${randomId}`
    const guestName = `ゲストユーザー_${timestamp}`

    console.log('新しいゲストユーザーを作成します')
    console.log('ゲストトークン:', guestToken)
    console.log('ゲスト名:', guestName)

    const guestUser = await prisma.users.create({
      data: {
        id: `guest_${timestamp}_${randomId}`,
        name: guestName,
        isGuest: true,
        guestToken: guestToken,
        updatedAt: new Date()
      }
    })
    console.log('ゲストユーザーが作成されました:', guestUser)

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

// ゲストユーザーを復元
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

    // トークンでゲストユーザーを検索
    const guestUser = await prisma.users.findFirst({
      where: {
        guestToken: guestToken,
        isGuest: true
      }
    })

    if (!guestUser) {
      console.log('ゲストユーザーが見つかりません')
      return NextResponse.json(
        { success: false, error: 'Guest user not found' },
        { status: 404 }
      )
    }

    console.log('ゲストユーザーが見つかりました:', guestUser)

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