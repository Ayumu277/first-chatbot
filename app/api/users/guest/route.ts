import { NextResponse } from 'next/server'
import { PrismaClient } from '../../../generated/prisma'

const prisma = new PrismaClient()

// ゲストユーザーを作成または取得
export async function POST() {
  try {
    console.log('ゲストユーザー作成APIが呼び出されました')

    // 既存のゲストユーザーがあるかチェック
    const existingGuest = await prisma.user.findFirst({
      where: {
        isGuest: true
      }
    })

    if (existingGuest) {
      console.log('既存のゲストユーザーを使用します:', existingGuest)
      return NextResponse.json({
        success: true,
        user: {
          id: existingGuest.id,
          name: existingGuest.name,
          isGuest: existingGuest.isGuest,
          guestToken: existingGuest.guestToken
        }
      })
    }

    // 新しいゲストユーザーを作成
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substr(2, 9)
    const guestToken = `guest_${timestamp}_${randomId}`
    const guestName = `ゲストユーザー_${timestamp}`

    console.log('新しいゲストユーザーを作成します')
    console.log('ゲストトークン:', guestToken)
    console.log('ゲスト名:', guestName)

    const guestUser = await prisma.user.create({
      data: {
        name: guestName,
        isGuest: true,
        guestToken: guestToken
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