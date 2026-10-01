import { NextRequest, NextResponse } from 'next/server'
import { saveConnection, discoverBusinessStructure } from '@/lib/meta-connections'
import { getAuthenticatedUserId } from '@/lib/supabase/server'

// Página de retorno do popup de OAuth do Facebook (sucesso ou erro) — visual consistente com o
// resto do vmetrics (fonte Jura, card arredondado, gradiente de fundo igual ao da tela de login
// em components/auth/LoginForm.tsx, logo em /logo.svg) em vez do card genérico em Arial que tinha
// antes. `script` é o JS de postMessage+window.close() que cada chamador monta (o payload muda
// por caso) — só a casca visual é compartilhada, o comportamento de cada tela continua o mesmo.
function renderConnectionPage({
  title,
  variant,
  heading,
  message,
  detail,
  script
}: {
  title: string
  variant: 'success' | 'error'
  heading: string
  message: string
  detail?: string
  script: string
}): string {
  const accent = variant === 'success' ? '#059669' : '#dc2626'
  const iconBg = variant === 'success' ? '#d1fae5' : '#fee2e2'
  const icon = variant === 'success'
    ? '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
    : '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Jura:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Jura', Arial, sans-serif;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          color: #111827;
        }
        .card {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
          padding: 40px 32px;
          text-align: center;
        }
        .logo { height: 32px; width: auto; margin: 0 auto 24px; display: block; }
        .icon-wrap {
          width: 56px;
          height: 56px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          background: ${iconBg};
        }
        h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px; color: ${accent}; }
        p.message { font-size: 14px; color: #4b5563; margin: 0; line-height: 1.5; }
        p.detail { font-size: 12px; color: #9ca3af; margin: 12px 0 0; }
      </style>
    </head>
    <body>
      <div class="card">
        <img src="/logo.svg" alt="vmetrics" class="logo" />
        <div class="icon-wrap">${icon}</div>
        <h1>${heading}</h1>
        <p class="message">${message}</p>
        ${detail ? `<p class="detail">${detail}</p>` : ''}
      </div>
      <script>${script}</script>
    </body>
    </html>
  `
}

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

    // A conexão de um perfil Meta só pode ser vinculada a um usuário vmetrics já logado
    // (login continua sendo email/senha via Supabase Auth — o Facebook aqui só conecta o
    // ativo, nunca autentica no vmetrics). Sem isso, saveConnection() não teria a quem
    // atribuir a conexão.
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Sessão do vmetrics não encontrada. Faça login antes de conectar uma conta Meta.'
      }, { status: 401 })
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
        userId,
        fbUser: {
          id: responseData.fb_user_id,
          name: responseData.fb_user_name ?? undefined,
          email: responseData.fb_user_email ?? undefined,
        },
        accessToken: responseData.access_token,
        tokenType: 'user',
      })
      const discovery = await discoverBusinessStructure(connectionId, responseData.access_token)
      console.log('💾 Conexão salva no Supabase:', { connectionId, userId, ...discovery })
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
      
      const errorHtml = renderConnectionPage({
        title: 'Erro de Conexão',
        variant: 'error',
        heading: 'Erro ao conectar com Facebook',
        message: errorDescription || 'Ocorreu um erro durante a conexão.',
        detail: errorReason || error || undefined,
        script: `
          if (window.opener) {
            window.opener.postMessage({
              type: 'FACEBOOK_ERROR',
              message: '${errorDescription || 'Erro ao conectar com Facebook'}'
            }, '*');
          }
          setTimeout(() => {
            window.close();
          }, 3000);
        `
      })
      
      return new NextResponse(errorHtml, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      })
    }

    // Se temos o código de autorização
    if (code) {
      console.log('Facebook authorization code received:', code.substring(0, 20) + '...')

      // Mesma checagem do handler POST: a conexão precisa de uma sessão vmetrics ativa para
      // saber a quem atribuir o ativo conectado.
      const userId = await getAuthenticatedUserId()
      if (!userId) {
        return new NextResponse(
          renderConnectionPage({
            title: 'Sessão Expirada',
            variant: 'error',
            heading: 'Sessão não encontrada',
            message: 'Faça login no vmetrics antes de conectar uma conta Meta.',
            script: `
              if (window.opener) {
                window.opener.postMessage({ type: 'FACEBOOK_ERROR', message: 'Sessão do vmetrics não encontrada.' }, '*');
              }
              setTimeout(() => window.close(), 3000);
            `
          }),
          { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        )
      }

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
            userId,
            fbUser: {
              id: userData.id,
              name: userData.name ?? undefined,
              email: userData.email ?? undefined,
            },
            accessToken: tokenData.access_token,
            tokenType: 'user',
          })
          const discovery = await discoverBusinessStructure(connectionId, tokenData.access_token)
          console.log('💾 Conexão salva no Supabase (GET/redirect flow):', { connectionId, userId, ...discovery })
        } catch (persistError) {
          console.error('⚠️ Falha ao persistir conexão no Supabase (login continua normalmente):', persistError)
        }

        // Retornar página de sucesso
        const successHtml = renderConnectionPage({
          title: 'Conexão Realizada',
          variant: 'success',
          heading: 'Conexão Realizada!',
          message: 'Sua conta do Facebook foi conectada com sucesso.',
          detail: `Usuário: ${userData.name || 'N/A'}`,
          script: `
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
          `
        })
        
        const successResponse = new NextResponse(successHtml, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
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
        
        const errorHtml = renderConnectionPage({
          title: 'Erro na Troca de Token',
          variant: 'error',
          heading: 'Erro na Troca de Token',
          message: tokenError instanceof Error ? tokenError.message : 'Erro desconhecido',
          script: `
            if (window.opener) {
              window.opener.postMessage({
                type: 'FACEBOOK_ERROR',
                message: '${tokenError instanceof Error ? tokenError.message : 'Erro na troca de token'}'
              }, '*');
            }
            setTimeout(() => {
              window.close();
            }, 3000);
          `
        })
        
        return new NextResponse(errorHtml, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })
      }
    }

    // Se não temos token nem erro, algo deu errado
    const errorHtml = renderConnectionPage({
      title: 'Erro de Conexão',
      variant: 'error',
      heading: 'Erro de Conexão',
      message: 'Não foi possível processar a resposta do Facebook.',
      script: `
        if (window.opener) {
          window.opener.postMessage({
            type: 'FACEBOOK_ERROR',
            message: 'Não foi possível processar a resposta do Facebook'
          }, '*');
        }
        setTimeout(() => {
          window.close();
        }, 3000);
      `
    })
    
    return new NextResponse(errorHtml, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })

  } catch (error: unknown) {
    console.error('Facebook callback error:', error)
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    const errorHtml = renderConnectionPage({
      title: 'Erro Interno',
      variant: 'error',
      heading: 'Erro Interno',
      message: 'Ocorreu um erro interno durante a conexão.',
      script: `
        if (window.opener) {
          window.opener.postMessage({
            type: 'FACEBOOK_ERROR',
            message: 'Erro interno do servidor'
          }, '*');
        }
        setTimeout(() => {
          window.close();
        }, 3000);
      `
    })
    
    return new NextResponse(errorHtml, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  }
} 