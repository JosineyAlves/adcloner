import { NextRequest, NextResponse } from 'next/server'
import { saveConnection, discoverBusinessStructure } from '@/lib/meta-connections'

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
    // Para popup do Facebook SDK, NÃO enviar redirect_uri
    // O Facebook usa seu próprio redirect URI interno
    console.log('🔧 App URL:', appUrl)
    console.log('🔧 Não enviando redirect_uri para popup')
    const tokenUrl = `https://graph.facebook.com/v23.0/oauth/access_token`
    
    console.log('📤 Trocando código por token...')
    
    // Preparar parâmetros para a requisição
    // Para popup, não enviar redirect_uri
    const params: any = {
      client_id: appId,
      client_secret: appSecret,
      code: code
    }
    
    console.log('🔧 Parâmetros da requisição:', {
      client_id: appId,
      client_secret: '***',
      code: code ? code.substring(0, 20) + '...' : 'não fornecido'
    })
    
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

    // OAuth clássico (perfil base, ver seção 38) — token é de USUÁRIO pessoal, não de
    // sistema. Buscamos id/nome/e-mail reais via /me em vez de client_business_id (campo
    // que só existe pra token de system user). discoverBusinessStructure não depende de
    // qual tipo de token é — ela já usa /me/businesses, que funciona igual pros dois casos.
    console.log('🔍 Obtendo dados do usuário conectado...')
    const meResponse = await fetch(
      `https://graph.facebook.com/v23.0/me?fields=id,name,email&access_token=${tokenData.access_token}`
    )

    const meData = await meResponse.json()
    console.log('📊 Dados do usuário:', meData)

    if (meData.error) {
      console.error('❌ Erro ao obter dados do usuário:', meData.error)
      return NextResponse.json({
        success: false,
        error: `Erro ao obter dados do usuário: ${meData.error.message || 'Erro desconhecido'}`
      }, { status: 400 })
    }

    // Retornar dados do token de usuário
    const responseData = {
      success: true,
      access_token: tokenData.access_token,
      fb_user_id: meData.id,
      fb_user_name: meData.name || null,
      fb_user_email: meData.email || null,
      token_type: 'user_token',
      expires_in: tokenData.expires_in || null
    }

    console.log('✅ Token de usuário obtido com sucesso')
    console.log('📋 Dados retornados:', {
      hasToken: !!responseData.access_token,
      hasUserId: !!responseData.fb_user_id,
      userName: responseData.fb_user_name,
      tokenType: responseData.token_type
    })

    // Persistir a conexão no Supabase e descobrir a estrutura de Business Manager/contas.
    // Best-effort: se isso falhar, não deve quebrar o fluxo de login existente (cookies abaixo).
    try {
      const connectionId = await saveConnection({
        fbUser: {
          id: responseData.fb_user_id,
          name: responseData.fb_user_name ?? undefined,
          email: responseData.fb_user_email ?? undefined,
        },
        accessToken: responseData.access_token,
        tokenType: 'user',
      })
      const discovery = await discoverBusinessStructure(connectionId, responseData.access_token)
      console.log('💾 Conexão salva no Supabase:', { connectionId, ...discovery })
    } catch (persistError) {
      console.error('⚠️ Falha ao persistir conexão no Supabase (login continua normalmente):', persistError)
    }

    // Criar resposta com cookie para salvar o token
    const response = NextResponse.json(responseData, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })

    // Salvar token em cookie seguro (httpOnly para segurança)
    response.cookies.set('fb_access_token', responseData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: '/'
    })

    // Nota: cookie fb_business_id não é mais setado aqui — client_business_id só existe pra
    // token de system user, e o fluxo agora é OAuth clássico (token de usuário pessoal, ver
    // seção 38). app/api/facebook/accounts/route.ts (fallback legado) já trata a ausência
    // desse cookie normalmente, só deixa de mostrar o nome do Business Manager no fallback.

    return response

  } catch (error) {
    console.error('❌ Erro interno no processamento:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
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

        // Persistir a conexão no Supabase e descobrir a estrutura de Business Manager/contas.
        // Best-effort: mesma lógica do handler POST (ver seção 38/39 do doc do projeto) —
        // se falhar, não deve quebrar a tela de sucesso do popup.
        try {
          const connectionId = await saveConnection({
            fbUser: {
              id: userData.id,
              name: userData.name ?? undefined,
              email: userData.email ?? undefined,
            },
            accessToken: tokenData.access_token,
            tokenType: 'user',
          })
          const discovery = await discoverBusinessStructure(connectionId, tokenData.access_token)
          console.log('💾 Conexão salva no Supabase (GET/redirect flow):', { connectionId, ...discovery })
        } catch (persistError) {
          console.error('⚠️ Falha ao persistir conexão no Supabase (login continua normalmente):', persistError)
        }

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
                    userInfo: ${JSON.stringify(userData)},
                    accessToken: ${JSON.stringify(tokenData.access_token)}
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
        
        const successResponse = new NextResponse(successHtml, {
          headers: { 'Content-Type': 'text/html' }
        })

        // Salvar token em cookie seguro (httpOnly) — mesmo cookie que o handler POST seta,
        // agora também setado aqui pois este é o fluxo (redirect_uri explícito) usado pelo
        // "Conectar Perfil" desde a seção 39.
        successResponse.cookies.set('fb_access_token', tokenData.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 dias
          path: '/'
        })

        return successResponse

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