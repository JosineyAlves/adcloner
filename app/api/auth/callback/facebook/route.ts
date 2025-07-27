import { NextRequest, NextResponse } from 'next/server'

// Função POST para processar código do Login para Empresas
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    
    console.log('🔄 Processando código de autorização:', code ? code.substring(0, 20) + '...' : 'não fornecido')
    
    if (!code) {
      return NextResponse.json({ 
        success: false, 
        error: 'Código de autorização não fornecido' 
      }, { status: 400 })
    }

    // Variáveis de ambiente
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
    const appSecret = process.env.FACEBOOK_APP_SECRET
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!appId || !appSecret || !appUrl) {
      console.error('❌ Variáveis de ambiente não configuradas')
      return NextResponse.json({ 
        success: false, 
        error: 'Configuração do servidor incompleta' 
      }, { status: 500 })
    }

    // Trocar código por token de acesso
    // Para Login para Empresas, usar o redirect URI configurado
    const redirectUri = `${appUrl}/accounts`
    console.log('🔧 Redirect URI:', redirectUri)
    console.log('🔧 App URL:', appUrl)
    const tokenUrl = `https://graph.facebook.com/v23.0/oauth/access_token`
    
    console.log('📤 Trocando código por token...')
    
    // Preparar parâmetros para a requisição
    const params: any = {
      client_id: appId,
      client_secret: appSecret,
      code: code
    }
    
    // Só adicionar redirect_uri se definido
    if (redirectUri) {
      params.redirect_uri = redirectUri
    }
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params)
    })

    const tokenData = await tokenResponse.json()
    console.log('📥 Resposta da troca de token:', tokenData)

    if (tokenData.error) {
      console.error('❌ Erro na troca de token:', tokenData.error)
      return NextResponse.json({ 
        success: false, 
        error: `Erro na troca de token: ${tokenData.error.message || 'Erro desconhecido'}` 
      }, { status: 400 })
    }

    if (!tokenData.access_token) {
      console.error('❌ Token não recebido')
      return NextResponse.json({ 
        success: false, 
        error: 'Token de acesso não recebido' 
      }, { status: 400 })
    }

    // Obter Client Business ID (para token do sistema)
    console.log('🔍 Obtendo Client Business ID...')
    const businessResponse = await fetch(
      `https://graph.facebook.com/v23.0/me?fields=client_business_id&access_token=${tokenData.access_token}`
    )
    
    const businessData = await businessResponse.json()
    console.log('📊 Dados do negócio:', businessData)

    if (businessData.error) {
      console.error('❌ Erro ao obter Client Business ID:', businessData.error)
      return NextResponse.json({ 
        success: false, 
        error: `Erro ao obter dados do negócio: ${businessData.error.message || 'Erro desconhecido'}` 
      }, { status: 400 })
    }

    // Retornar dados do token do sistema
    const responseData = {
      success: true,
      access_token: tokenData.access_token,
      client_business_id: businessData.client_business_id,
      system_user_id: businessData.id,
      token_type: 'system_user_token',
      expires_in: tokenData.expires_in || null
    }

    console.log('✅ Token do sistema obtido com sucesso')
    console.log('📋 Dados retornados:', {
      hasToken: !!responseData.access_token,
      hasBusinessId: !!responseData.client_business_id,
      hasSystemUserId: !!responseData.system_user_id,
      tokenType: responseData.token_type
    })

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('❌ Erro interno no processamento:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const accessToken = searchParams.get('access_token')
    const error = searchParams.get('error')
    const errorReason = searchParams.get('error_reason')
    const errorDescription = searchParams.get('error_description')

    console.log('Facebook callback - Params:', { 
      hasCode: !!code,
      hasAccessToken: !!accessToken, 
      error, 
      errorReason, 
      errorDescription 
    })

    // Se houve erro no OAuth
    if (error) {
      console.error('Facebook OAuth error:', { error, errorReason, errorDescription })
      
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erro de Conexão</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: #f8f9fa;
              color: #333;
            }
            .error { color: #dc2626; }
            .container {
              max-width: 500px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">❌</div>
            <h1 class="error">Erro ao conectar com Facebook</h1>
            <p>${errorDescription || 'Ocorreu um erro durante a conexão.'}</p>
            <p><small>${errorReason || error}</small></p>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'FACEBOOK_ERROR',
                  message: '${errorDescription || 'Erro ao conectar com Facebook'}'
                }, '*');
              }
              setTimeout(() => {
                window.close();
              }, 3000);
            </script>
          </div>
        </body>
        </html>
      `
      
      return new NextResponse(errorHtml, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Se temos o código de autorização
    if (code) {
      console.log('Facebook authorization code received:', code.substring(0, 20) + '...')
      
      try {
        // Trocar code por access_token
        const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
        const appSecret = process.env.FACEBOOK_APP_SECRET
        const appUrl = process.env.NEXT_PUBLIC_APP_URL

        if (!appId || !appSecret || !appUrl) {
          throw new Error('Variáveis de ambiente não configuradas')
        }

        const redirectUri = `${appUrl}/api/auth/callback/facebook`
        const tokenUrl = `https://graph.facebook.com/v23.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`

        console.log('Trocando code por access_token...')
        const tokenResponse = await fetch(tokenUrl)
        const tokenData = await tokenResponse.json()

        console.log('Token response status:', tokenResponse.status)
        console.log('Token response data:', tokenData)

        if (tokenData.error) {
          throw new Error(`Facebook API error: ${tokenData.error.message || 'Unknown error'}`)
        }

        if (!tokenData.access_token) {
          throw new Error('No access token received from Facebook')
        }

        // Obter informações do usuário
        const userInfoUrl = `https://graph.facebook.com/v23.0/me?access_token=${tokenData.access_token}&fields=id,name,email`
        const userResponse = await fetch(userInfoUrl)
        const userData = await userResponse.json()

        console.log('User info:', userData)

        // Retornar página de sucesso
        const successHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Conexão Realizada</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 50px; 
                background: #f8f9fa;
                color: #333;
              }
              .success { color: #059669; }
              .container {
                max-width: 500px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .icon {
                font-size: 48px;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">✅</div>
              <h1 class="success">Conexão Realizada!</h1>
              <p>Sua conta do Facebook foi conectada com sucesso.</p>
              <p><small>Usuário: ${userData.name || 'N/A'}</small></p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'FACEBOOK_SUCCESS',
                    userInfo: ${JSON.stringify(userData)}
                  }, '*');
                }
                setTimeout(() => {
                  window.close();
                }, 2000);
              </script>
            </div>
          </body>
          </html>
        `
        
        return new NextResponse(successHtml, {
          headers: { 'Content-Type': 'text/html' }
        })

      } catch (tokenError) {
        console.error('Error exchanging code for token:', tokenError)
        
        const errorHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Erro na Troca de Token</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 50px; 
                background: #f8f9fa;
                color: #333;
              }
              .error { color: #dc2626; }
              .container {
                max-width: 500px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .icon {
                font-size: 48px;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">❌</div>
              <h1 class="error">Erro na Troca de Token</h1>
              <p>${tokenError instanceof Error ? tokenError.message : 'Erro desconhecido'}</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'FACEBOOK_ERROR',
                    message: '${tokenError instanceof Error ? tokenError.message : 'Erro na troca de token'}'
                  }, '*');
                }
                setTimeout(() => {
                  window.close();
                }, 3000);
              </script>
            </div>
          </body>
          </html>
        `
        
        return new NextResponse(errorHtml, {
          headers: { 'Content-Type': 'text/html' }
        })
      }
    }

    // Se não temos token nem erro, algo deu errado
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Erro de Conexão</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: #f8f9fa;
            color: #333;
          }
          .error { color: #dc2626; }
          .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">❌</div>
          <h1 class="error">Erro de Conexão</h1>
          <p>Não foi possível processar a resposta do Facebook.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'FACEBOOK_ERROR',
                message: 'Não foi possível processar a resposta do Facebook'
              }, '*');
            }
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </div>
      </body>
      </html>
    `
    
    return new NextResponse(errorHtml, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error: unknown) {
    console.error('Facebook callback error:', error)
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Erro Interno</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: #f8f9fa;
            color: #333;
          }
          .error { color: #dc2626; }
          .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">❌</div>
          <h1 class="error">Erro Interno</h1>
          <p>Ocorreu um erro interno durante a conexão.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'FACEBOOK_ERROR',
                message: 'Erro interno do servidor'
              }, '*');
            }
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </div>
      </body>
      </html>
    `
    
    return new NextResponse(errorHtml, {
      headers: { 'Content-Type': 'text/html' }
    })
  }
} 