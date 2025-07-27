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