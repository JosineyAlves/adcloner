import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!appId || !appUrl) {
      return NextResponse.json({
        success: false,
        error: 'Variáveis de ambiente não configuradas'
      })
    }

    const redirectUri = `${appUrl}/api/auth/callback/facebook`
    
    // ABORDAGEM ALTERNATIVA: Usando scope em vez de config_id
    const scope = 'ads_management,business_management,pages_show_list,pages_read_engagement,public_profile,email,pages_manage_metadata,ads_read'
    const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code&_rdc=1&_rdr`

    console.log('Gerando URL de autenticação (simples):', authUrl)

    return NextResponse.json({
      success: true,
      authUrl,
      method: 'scope'
    })

  } catch (error) {
    console.error('Erro ao gerar URL de autenticação:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
} 