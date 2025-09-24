import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('fb_access_token')?.value
    
    if (!accessToken) {
      return NextResponse.json({ 
        success: false,
        message: 'Nenhuma conta conectada. Conecte sua conta do Facebook primeiro.'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const adsetId = searchParams.get('adsetId')
    
    if (!accountId) {
      return NextResponse.json({
        success: false,
        message: 'ID da conta é obrigatório'
      }, { status: 400 })
    }

    let url = `https://graph.facebook.com/v23.0/act_${accountId}/ads?fields=id,name,status,adset_id,campaign_id,creative,created_time,updated_time&access_token=${accessToken}`
    
    if (adsetId) {
      url = `https://graph.facebook.com/v23.0/${adsetId}/ads?fields=id,name,status,adset_id,campaign_id,creative,created_time,updated_time&access_token=${accessToken}`
    }

    console.log(`📋 Buscando anúncios ${adsetId ? `do conjunto ${adsetId}` : `da conta ${accountId}`}`)

    // Buscar anúncios
    const response = await fetch(url)
    const data = await response.json()

    if (data.error) {
      console.error('Erro ao buscar anúncios:', data.error)
      return NextResponse.json({
        success: false,
        message: data.error.message || 'Erro ao buscar anúncios'
      }, { status: 400 })
    }

    console.log(`✅ Encontrados ${data.data?.length || 0} anúncios`)

    return NextResponse.json({
      success: true,
      ads: data.data || []
    })

  } catch (error) {
    console.error('Error fetching ads:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
