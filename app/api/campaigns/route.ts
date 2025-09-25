import { NextRequest, NextResponse } from 'next/server'
import { Campaign } from '@/lib/types'
import { FacebookAPI } from '@/lib/facebook-api'

const facebookAPI = new FacebookAPI()

export async function GET(request: NextRequest) {
  try {
    // Verificar se temos um token de acesso
    const accessToken = request.cookies.get('fb_access_token')?.value
    
    if (!accessToken) {
      return NextResponse.json({ 
        campaigns: [],
        success: false,
        message: 'Nenhuma conta conectada. Conecte sua conta do Facebook primeiro.'
      })
    }

    // Validar token
    const isValid = await facebookAPI.validateToken(accessToken)
    if (!isValid) {
      return NextResponse.json({ 
        campaigns: [],
        success: false,
        message: 'Token inválido ou expirado. Reconecte sua conta do Facebook.'
      })
    }

    // Buscar contas de anúncios
    const adAccounts = await facebookAPI.getAdAccounts(accessToken)
    const allCampaigns: Campaign[] = []

    // Para cada conta, buscar campanhas
    for (const account of adAccounts) {
      try {
        const campaigns = await facebookAPI.getCampaigns(account.id, accessToken)
        allCampaigns.push(...campaigns)
      } catch (error) {
        console.error(`Error getting campaigns for account ${account.id}:`, error)
      }
    }
    
    return NextResponse.json({ 
      campaigns: allCampaigns,
      success: true 
    })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
} 