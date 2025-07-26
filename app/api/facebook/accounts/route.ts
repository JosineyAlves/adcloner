import { NextRequest, NextResponse } from 'next/server'
import { FacebookAPI } from '@/lib/facebook-api'
import { FacebookAccount } from '@/lib/types'

const facebookAPI = new FacebookAPI()

export async function GET(request: NextRequest) {
  try {
    // Verificar se temos um token de acesso
    const accessToken = request.cookies.get('fb_access_token')?.value
    
    if (!accessToken) {
      // Sem token, retornar array vazio
      return NextResponse.json({ 
        accounts: [],
        success: true,
        message: 'Nenhuma conta conectada. Conecte sua conta do Facebook primeiro.'
      })
    }

    // Validar token
    const isValid = await facebookAPI.validateToken(accessToken)
    if (!isValid) {
      return NextResponse.json({ 
        accounts: [],
        success: false,
        message: 'Token inválido ou expirado. Reconecte sua conta do Facebook.'
      })
    }

    // Buscar dados reais do Facebook
    try {
      const accounts = await facebookAPI.getAdAccounts(accessToken)
      
      // Para cada conta, buscar páginas e pixels
      const accountsWithDetails = await Promise.all(
        accounts.map(async (account) => {
          try {
            const pages = await facebookAPI.getPages(accessToken)
            const pixels = await facebookAPI.getPixels(accessToken)
            
            return {
              ...account,
              pages,
              pixels
            }
          } catch (error) {
            console.error(`Error getting details for account ${account.id}:`, error)
            return account
          }
        })
      )
      
      return NextResponse.json({ 
        accounts: accountsWithDetails,
        success: true 
      })
      
    } catch (apiError) {
      console.error('Facebook API error:', apiError)
      
      return NextResponse.json({ 
        accounts: [],
        success: false,
        message: 'Erro ao buscar contas do Facebook. Verifique suas permissões.'
      })
    }
    
  } catch (error) {
    console.error('Error fetching Facebook accounts:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch accounts',
        accounts: [],
        success: false
      },
      { status: 500 }
    )
  }
} 