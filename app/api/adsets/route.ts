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
    const campaignId = searchParams.get('campaignId')
    
    if (!accountId) {
      return NextResponse.json({
        success: false,
        message: 'ID da conta é obrigatório'
      }, { status: 400 })
    }

    let url = `https://graph.facebook.com/v23.0/act_${accountId}/adsets?fields=id,name,status,campaign_id,daily_budget,lifetime_budget,optimization_goal,targeting,created_time,updated_time&access_token=${accessToken}`
    
    if (campaignId) {
      url = `https://graph.facebook.com/v23.0/${campaignId}/adsets?fields=id,name,status,campaign_id,daily_budget,lifetime_budget,optimization_goal,targeting,created_time,updated_time&access_token=${accessToken}`
    }

    console.log(`📋 Buscando conjuntos de anúncios ${campaignId ? `da campanha ${campaignId}` : `da conta ${accountId}`}`)

    // Buscar conjuntos de anúncios
    const response = await fetch(url)
    const data = await response.json()

    if (data.error) {
      console.error('Erro ao buscar conjuntos de anúncios:', data.error)
      return NextResponse.json({
        success: false,
        message: data.error.message || 'Erro ao buscar conjuntos de anúncios'
      }, { status: 400 })
    }

    console.log(`✅ Encontrados ${data.data?.length || 0} conjuntos de anúncios`)

    return NextResponse.json({
      success: true,
      adsets: data.data || []
    })

  } catch (error) {
    console.error('Error fetching adsets:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
