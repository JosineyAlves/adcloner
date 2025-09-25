import { NextRequest, NextResponse } from 'next/server'
import { FacebookAPI } from '@/lib/facebook-api'

const facebookAPI = new FacebookAPI()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json()
    const campaignId = params.id
    const accessToken = request.cookies.get('fb_access_token')?.value
    
    if (!accessToken) {
      return NextResponse.json({ 
        success: false,
        message: 'Nenhuma conta conectada. Conecte sua conta do Facebook primeiro.'
      }, { status: 401 })
    }

    if (!status || !['ACTIVE', 'PAUSED'].includes(status)) {
      return NextResponse.json({
        success: false,
        message: 'Status inválido. Use ACTIVE ou PAUSED.'
      }, { status: 400 })
    }

    console.log(`🔄 Atualizando status da campanha ${campaignId} para ${status}`)

    await facebookAPI.updateCampaignStatus(campaignId, accessToken, status as 'ACTIVE' | 'PAUSED')

    return NextResponse.json({
      success: true,
      message: `Campanha ${status === 'ACTIVE' ? 'ativada' : 'pausada'} com sucesso!`
    })

  } catch (error: any) {
    console.error('Error updating campaign status:', error)
    return NextResponse.json({
      success: false,
      message: error.message || 'Erro ao atualizar status da campanha'
    }, { status: 500 })
  }
}
