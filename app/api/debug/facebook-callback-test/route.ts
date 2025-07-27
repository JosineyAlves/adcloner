import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorReason = searchParams.get('error_reason')
  const errorDescription = searchParams.get('error_description')

  console.log('=== DEBUG FACEBOOK CALLBACK ===')
  console.log('URL:', request.url)
  console.log('Code:', code ? code.substring(0, 20) + '...' : 'null')
  console.log('Error:', error)
  console.log('Error Reason:', errorReason)
  console.log('Error Description:', errorDescription)

  // Verificar variáveis de ambiente
  const envCheck = {
    NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
    FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET ? 'PRESENT' : 'MISSING',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV
  }

  console.log('Environment variables:', envCheck)

  if (error) {
    return NextResponse.json({
      success: false,
      type: 'oauth_error',
      error,
      errorReason,
      errorDescription,
      envCheck
    })
  }

  if (!code) {
    return NextResponse.json({
      success: false,
      type: 'no_code',
      message: 'No authorization code received',
      envCheck
    })
  }

  // Testar troca de code por access_token
  try {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
    const appSecret = process.env.FACEBOOK_APP_SECRET
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!appId || !appSecret || !appUrl) {
      return NextResponse.json({
        success: false,
        type: 'missing_env_vars',
        missing: {
          appId: !appId,
          appSecret: !appSecret,
          appUrl: !appUrl
        },
        envCheck
      })
    }

    const redirectUri = `${appUrl}/api/auth/callback/facebook`
    const tokenUrl = `https://graph.facebook.com/v23.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`

    console.log('Token URL (without secret):', tokenUrl.replace(appSecret, '[SECRET]'))

    const tokenResponse = await fetch(tokenUrl)
    const tokenData = await tokenResponse.json()

    console.log('Token response status:', tokenResponse.status)
    console.log('Token response data:', tokenData)

    if (tokenData.error) {
      return NextResponse.json({
        success: false,
        type: 'facebook_api_error',
        error: tokenData.error,
        status: tokenResponse.status,
        envCheck
      })
    }

    if (!tokenData.access_token) {
      return NextResponse.json({
        success: false,
        type: 'no_access_token',
        message: 'No access token in response',
        tokenData,
        status: tokenResponse.status,
        envCheck
      })
    }

    // Testar obtenção de informações do usuário
    const userInfoUrl = `https://graph.facebook.com/v23.0/me?access_token=${tokenData.access_token}&fields=id,name,email`
    const userResponse = await fetch(userInfoUrl)
    const userData = await userResponse.json()

    console.log('User info response:', userData)

    return NextResponse.json({
      success: true,
      type: 'success',
      accessToken: tokenData.access_token.substring(0, 20) + '...',
      userInfo: userData,
      envCheck
    })

  } catch (apiError) {
    console.error('API Error:', apiError)
    
    return NextResponse.json({
      success: false,
      type: 'exception',
      error: apiError instanceof Error ? apiError.message : String(apiError),
      envCheck
    })
  }
} 