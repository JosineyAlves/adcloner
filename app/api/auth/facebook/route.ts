import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback/facebook`
    
    const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=ads_management,business_management,pages_show_list,pages_read_engagement,public_profile,email&response_type=code`

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Facebook auth error:', error)
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    )
  }
} 