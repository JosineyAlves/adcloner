import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json()
    const adId = params.id
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

    console.log(`🔄 Atualizando status do anúncio ${adId} para ${status}`)

    // Atualizar status do anúncio
    const response = await fetch(
      `https://graph.facebook.com/v23.0/${adId}`,
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
      console.error('Erro ao atualizar status do anúncio:', data.error)
      return NextResponse.json({
        success: false,
        message: data.error.message || 'Erro ao atualizar status do anúncio'
      }, { status: 400 })
    }

    console.log(`✅ Status do anúncio ${adId} atualizado para ${status}`)

    return NextResponse.json({
      success: true,
      message: `Status do anúncio atualizado para ${status}`,
      adId,
      status
    })

  } catch (error) {
    console.error('Error updating ad status:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
