import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
    const configId = process.env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://adcloner.vercel.app'}/api/auth/callback/facebook`
    
    // Força reautorização adicionando auth_type=reauthorize
    const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&config_id=${configId}&response_type=code&auth_type=reauthorize`

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Facebook reauth error:', error)
    return NextResponse.json(
      { error: 'Failed to generate reauth URL' },
      { status: 500 }
    )
  }
} 