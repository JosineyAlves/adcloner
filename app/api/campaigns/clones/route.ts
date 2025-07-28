import { NextRequest, NextResponse } from 'next/server'
import { CampaignClone } from '@/lib/types'
import { FacebookAPI } from '@/lib/facebook-api'

const facebookAPI = new FacebookAPI()

export async function GET(request: NextRequest) {
  try {
    // Verificar se temos um token de acesso
    const accessToken = request.cookies.get('fb_access_token')?.value
    
    if (!accessToken) {
      return NextResponse.json({ 
        clones: [],
        success: false,
        message: 'Nenhuma conta conectada. Conecte sua conta do Facebook primeiro.'
      })
    }

    // Por enquanto, retornamos um array vazio
    // Em produção, você implementaria um banco de dados para rastrear clones
    const clones: CampaignClone[] = []
    
    return NextResponse.json({ 
      clones,
      success: true 
    })
  } catch (error) {
    console.error('Error fetching campaign clones:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clones' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sourceCampaignId, targetAccountId, campaignName } = await request.json()
    const accessToken = request.cookies.get('fb_access_token')?.value
    
    if (!accessToken) {
      return NextResponse.json({ 
        success: false,
        message: 'Nenhuma conta conectada. Conecte sua conta do Facebook primeiro.'
      }, { status: 401 })
    }

    // Buscar detalhes da campanha original
    const campaignDetails = await facebookAPI.getCampaignDetails(sourceCampaignId, accessToken)
    
    // Criar clone da campanha usando método CSV (similar ao manual)
    const cloneResult = await facebookAPI.cloneCampaignCSV(
      campaignDetails.accountId,
      targetAccountId,
      accessToken,
      sourceCampaignId
    )
    
    return NextResponse.json({ 
      success: true,
      clone: cloneResult
    })
  } catch (error) {
    console.error('Error cloning campaign:', error)
    return NextResponse.json(
      { error: 'Failed to clone campaign' },
      { status: 500 }
    )
  }
} 