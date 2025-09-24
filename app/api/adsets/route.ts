import { NextRequest, NextResponse } from 'next/server'
import { FacebookAPI } from '@/lib/facebook-api'

const facebookAPI = new FacebookAPI()

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

    console.log(`📋 Buscando conjuntos de anúncios ${campaignId ? `da campanha ${campaignId}` : `da conta ${accountId}`}`)

    // Usar o FacebookAPI para buscar conjuntos de anúncios simples
    const adsets = await facebookAPI.getSimpleAdSets(accountId, accessToken, campaignId || undefined)

    console.log(`✅ Encontrados ${adsets?.length || 0} conjuntos de anúncios`)

    return NextResponse.json({
      success: true,
      adsets: adsets || []
    })

  } catch (error) {
    console.error('Error fetching adsets:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    }, { status: 500 })
  }
}
