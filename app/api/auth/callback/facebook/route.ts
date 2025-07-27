import { NextRequest, NextResponse } from 'next/server'
import { FacebookAPI } from '@/lib/facebook-api'

const facebookAPI = new FacebookAPI()

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
      
      // TEMPORÁRIO: Redirecionar para debug detalhado
      const debugUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/debug/facebook-callback-test?code=${code}`
      return NextResponse.redirect(debugUrl)
      
      try {
        // Log das variáveis de ambiente para debug
        console.log('Debug - Environment variables:')
        console.log('NEXT_PUBLIC_FACEBOOK_APP_ID:', process.env.NEXT_PUBLIC_FACEBOOK_APP_ID)
        console.log('FACEBOOK_APP_SECRET:', process.env.FACEBOOK_APP_SECRET ? 'PRESENT' : 'MISSING')
        console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
        
        // Trocar código por token de acesso
        const tokenUrl = `https://graph.facebook.com/v23.0/oauth/access_token?client_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}&redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/facebook`)}`
        
        console.log('Debug - Token URL:', tokenUrl.replace(process.env.FACEBOOK_APP_SECRET || '', '[SECRET]'))
        
        const tokenResponse = await fetch(tokenUrl)
        
        console.log('Debug - Token response status:', tokenResponse.status)
        
        const tokenData = await tokenResponse.json()
        console.log('Debug - Token response data:', tokenData)
        
        if (tokenData.error) {
          console.error('Facebook token error:', tokenData.error)
          throw new Error(tokenData.error.message)
        }
        
        if (!tokenData.access_token) {
          console.error('No access token in response:', tokenData)
          throw new Error('No access token received from Facebook')
        }
        
        const accessToken = tokenData.access_token
        console.log('Access token obtained:', accessToken.substring(0, 20) + '...')
        
        // Obter informações básicas do usuário
        const userInfo = await facebookAPI.getUserInfo(accessToken)
        console.log('User info:', userInfo)

        // Salvar token em cookie
        const response = NextResponse.redirect(new URL('/', request.url))
        response.cookies.set('fb_access_token', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 60 // 60 dias
        })
        
        const successHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Conexão Bem-sucedida</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 50px; 
                background: #f0fdf4;
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
              .loading {
                color: #6b7280;
                margin-top: 20px;
              }
              .spinner {
                border: 3px solid #f3f3f3;
                border-top: 3px solid #059669;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                margin: 20px auto;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">✅</div>
              <h1 class="success">Conexão Realizada!</h1>
              <p>Sua conta do Facebook foi conectada com sucesso.</p>
              <p><strong>Usuário:</strong> ${userInfo.name}</p>
              <p><strong>ID:</strong> ${userInfo.id}</p>
              <div class="spinner"></div>
              <p class="loading">Fechando popup...</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'FACEBOOK_SUCCESS',
                    userInfo: ${JSON.stringify(userInfo)}
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

      } catch (apiError: unknown) {
        console.error('Facebook API error:', apiError)
        
        const errorMessage = apiError instanceof Error ? apiError.message : String(apiError)
        
        const errorHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Erro de API</title>
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
              <h1 class="error">Erro de API</h1>
              <p>Não foi possível processar sua conta do Facebook.</p>
              <p><small>${errorMessage}</small></p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'FACEBOOK_ERROR',
                    message: '${errorMessage}'
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

    // Fallback: Se temos o token de acesso diretamente (para compatibilidade)
    if (accessToken) {
      console.log('Facebook access token received directly:', accessToken.substring(0, 20) + '...')
      
      try {
        // Obter informações básicas do usuário
        const userInfo = await facebookAPI.getUserInfo(accessToken)
        console.log('User info:', userInfo)

        // Salvar token em cookie
        const response = NextResponse.redirect(new URL('/', request.url))
        response.cookies.set('fb_access_token', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 60 // 60 dias
        })
        
        const successHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Conexão Bem-sucedida</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 50px; 
                background: #f0fdf4;
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
              .loading {
                color: #6b7280;
                margin-top: 20px;
              }
              .spinner {
                border: 3px solid #f3f3f3;
                border-top: 3px solid #059669;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                margin: 20px auto;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">✅</div>
              <h1 class="success">Conexão Realizada!</h1>
              <p>Sua conta do Facebook foi conectada com sucesso.</p>
              <p><strong>Usuário:</strong> ${userInfo.name}</p>
              <p><strong>ID:</strong> ${userInfo.id}</p>
              <div class="spinner"></div>
              <p class="loading">Fechando popup...</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'FACEBOOK_SUCCESS',
                    userInfo: ${JSON.stringify(userInfo)}
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

      } catch (apiError: unknown) {
        console.error('Facebook API error:', apiError)
        
        const errorMessage = apiError instanceof Error ? apiError.message : String(apiError)
        
        const errorHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Erro de API</title>
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
              <h1 class="error">Erro de API</h1>
              <p>Não foi possível processar sua conta do Facebook.</p>
              <p><small>${errorMessage}</small></p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'FACEBOOK_ERROR',
                    message: '${errorMessage}'
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