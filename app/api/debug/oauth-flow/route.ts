import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const step = searchParams.get('step') || '1'
  
  console.log('=== DIAGNÓSTICO OAUTH FLOW ===')
  console.log('Step:', step)

  // Verificar variáveis de ambiente
  const envCheck = {
    NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
    FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET ? 'PRESENT' : 'MISSING',
    NEXT_PUBLIC_FACEBOOK_CONFIG_ID: process.env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV
  }

  console.log('Environment check:', envCheck)

  // Step 1: Verificar configuração básica
  if (step === '1') {
    const missingVars = Object.entries(envCheck)
      .filter(([key, value]) => value === 'MISSING' || !value)
      .map(([key]) => key)

    return NextResponse.json({
      step: 1,
      success: missingVars.length === 0,
      environment: envCheck,
      missing: missingVars,
      message: missingVars.length === 0 
        ? 'Todas as variáveis de ambiente estão configuradas'
        : `Variáveis faltando: ${missingVars.join(', ')}`
    })
  }

  // Step 2: Gerar URL de OAuth
  if (step === '2') {
    try {
      const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
      const configId = process.env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID
      const appUrl = process.env.NEXT_PUBLIC_APP_URL

      if (!appId || !configId || !appUrl) {
        return NextResponse.json({
          step: 2,
          success: false,
          error: 'Variáveis de ambiente não configuradas',
          required: { appId: !!appId, configId: !!configId, appUrl: !!appUrl }
        })
      }

      const redirectUri = `${appUrl}/api/auth/callback/facebook`
      const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&config_id=${configId}&response_type=code`

      return NextResponse.json({
        step: 2,
        success: true,
        authUrl,
        config: {
          appId,
          configId,
          redirectUri,
          appUrl
        }
      })
    } catch (error) {
      return NextResponse.json({
        step: 2,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  // Step 3: Testar troca de code por token
  if (step === '3') {
    const code = searchParams.get('code')
    
    if (!code) {
      return NextResponse.json({
        step: 3,
        success: false,
        error: 'Nenhum code fornecido'
      })
    }

    try {
      const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
      const appSecret = process.env.FACEBOOK_APP_SECRET
      const appUrl = process.env.NEXT_PUBLIC_APP_URL

      if (!appId || !appSecret || !appUrl) {
        return NextResponse.json({
          step: 3,
          success: false,
          error: 'Variáveis de ambiente não configuradas'
        })
      }

      const redirectUri = `${appUrl}/api/auth/callback/facebook`
      const tokenUrl = `https://graph.facebook.com/v23.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`

      console.log('Tentando trocar code por token...')
      const tokenResponse = await fetch(tokenUrl)
      const tokenData = await tokenResponse.json()

      console.log('Token response:', tokenData)

      if (tokenData.error) {
        return NextResponse.json({
          step: 3,
          success: false,
          error: 'Facebook API error',
          details: tokenData.error,
          status: tokenResponse.status
        })
      }

      return NextResponse.json({
        step: 3,
        success: true,
        tokenData,
        status: tokenResponse.status
      })

    } catch (error) {
      return NextResponse.json({
        step: 3,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  return NextResponse.json({
    success: false,
    error: 'Step inválido',
    availableSteps: [1, 2, 3]
  })
} 