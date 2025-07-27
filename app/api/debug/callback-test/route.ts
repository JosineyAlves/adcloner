import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorReason = searchParams.get('error_reason')
  const errorDescription = searchParams.get('error_description')

  // Simular o processo de troca de token
  if (code) {
    try {
      const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
      const appSecret = process.env.FACEBOOK_APP_SECRET
      const appUrl = process.env.NEXT_PUBLIC_APP_URL

      console.log('Debug - Testing token exchange:')
      console.log('App ID:', appId)
      console.log('App Secret:', appSecret ? 'PRESENT' : 'MISSING')
      console.log('App URL:', appUrl)
      console.log('Code:', code.substring(0, 20) + '...')

      if (!appId || !appSecret || !appUrl) {
        return NextResponse.json({
          success: false,
          error: 'Missing environment variables',
          missing: {
            appId: !appId,
            appSecret: !appSecret,
            appUrl: !appUrl
          }
        })
      }

      // URL para trocar code por access_token
      const tokenUrl = `https://graph.facebook.com/v23.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}&redirect_uri=${encodeURIComponent(`${appUrl}/api/auth/callback/facebook`)}`

      console.log('Token URL:', tokenUrl.replace(appSecret, '[SECRET]'))

      const tokenResponse = await fetch(tokenUrl)
      const tokenData = await tokenResponse.json()

      console.log('Token response status:', tokenResponse.status)
      console.log('Token response data:', tokenData)

      return NextResponse.json({
        success: true,
        code: code.substring(0, 20) + '...',
        tokenResponse: {
          status: tokenResponse.status,
          data: tokenData
        }
      })

    } catch (error) {
      console.error('Debug - Token exchange error:', error)
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
    }
  }

  return NextResponse.json({
    success: false,
    error: 'No code provided',
    params: {
      code: !!code,
      error,
      errorReason,
      errorDescription
    }
  })
} 