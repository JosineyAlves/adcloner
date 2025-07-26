import { NextRequest, NextResponse } from 'next/server'
import { getUserInfo } from '@/lib/facebook-api'

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('fb_access_token')?.value
    const userId = request.cookies.get('fb_user_id')?.value

    if (!accessToken || !userId) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    // Verificar se o token ainda é válido
    const userInfo = await getUserInfo(accessToken)

    return NextResponse.json({
      authenticated: true,
      user: userInfo
    })

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    )
  }
} 