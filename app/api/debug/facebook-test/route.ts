import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
    const appSecret = process.env.FACEBOOK_APP_SECRET
    const configId = process.env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    // Verificar se todas as variáveis estão presentes
    const missingVars = []
    if (!appId) missingVars.push('NEXT_PUBLIC_FACEBOOK_APP_ID')
    if (!appSecret) missingVars.push('FACEBOOK_APP_SECRET')
    if (!configId) missingVars.push('NEXT_PUBLIC_FACEBOOK_CONFIG_ID')
    if (!appUrl) missingVars.push('NEXT_PUBLIC_APP_URL')

    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        missing: missingVars
      })
    }

    // Gerar URL de autenticação
    const redirectUri = `${appUrl}/api/auth/callback/facebook`
    const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&config_id=${configId}&response_type=code`

    return NextResponse.json({
      success: true,
      config: {
        appId,
        configId,
        appUrl,
        redirectUri
      },
      authUrl,
      testUrl: authUrl + '&display=popup'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 