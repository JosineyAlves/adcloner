import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  console.log('=== TESTANDO CODE ESPECÍFICO ===')
  console.log('Code recebido:', code)

  if (!code) {
    return NextResponse.json({
      success: false,
      message: 'Nenhum code fornecido'
    })
  }

  try {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
    const appSecret = process.env.FACEBOOK_APP_SECRET
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    console.log('Configurações:')
    console.log('App ID:', appId)
    console.log('App Secret presente:', !!appSecret)
    console.log('App URL:', appUrl)

    if (!appId || !appSecret || !appUrl) {
      return NextResponse.json({
        success: false,
        type: 'missing_env_vars',
        missing: {
          appId: !appId,
          appSecret: !appSecret,
          appUrl: !appUrl
        }
      })
    }

    const redirectUri = `${appUrl}/api/auth/callback/facebook`
    const tokenUrl = `https://graph.facebook.com/v23.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`

    console.log('URL para troca de token (sem secret):', tokenUrl.replace(appSecret, '[SECRET]'))

    const tokenResponse = await fetch(tokenUrl)
    const tokenData = await tokenResponse.json()

    console.log('Status da resposta:', tokenResponse.status)
    console.log('Dados da resposta:', tokenData)

    return NextResponse.json({
      success: true,
      status: tokenResponse.status,
      tokenData,
      config: {
        appId,
        redirectUri,
        codeLength: code.length
      }
    })

  } catch (error) {
    console.error('Erro:', error)
    
    return NextResponse.json({
      success: false,
      type: 'exception',
      error: error instanceof Error ? error.message : String(error)
    })
  }
} 