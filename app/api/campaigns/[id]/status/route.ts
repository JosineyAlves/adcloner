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

    if (!['PAUSED', 'ACTIVE', 'DELETED'].includes(status)) {
      return NextResponse.json({
        success: false,
        message: 'Status inválido. Use PAUSED, ACTIVE ou DELETED.'
      }, { status: 400 })
    }

    console.log(`🔄 Atualizando status da campanha ${campaignId} para ${status}`)

    // Atualizar status da campanha
    const response = await fetch(
      `https://graph.facebook.com/v23.0/${campaignId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          status: status,
          access_token: accessToken,
        })
      }
    )

    const data = await response.json()

    if (data.error) {
      console.error('Erro ao atualizar status:', data.error)
      return NextResponse.json({
        success: false,
        message: data.error.message || 'Erro ao atualizar status da campanha'
      }, { status: 400 })
    }

    console.log(`✅ Status da campanha ${campaignId} atualizado para ${status}`)

    return NextResponse.json({
      success: true,
      message: `Status da campanha atualizado para ${status}`,
      campaignId,
      status
    })

  } catch (error) {
    console.error('Error updating campaign status:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
