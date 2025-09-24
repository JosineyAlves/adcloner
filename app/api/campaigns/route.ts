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
    
    if (!accountId) {
      return NextResponse.json({
        success: false,
        message: 'ID da conta é obrigatório'
      }, { status: 400 })
    }

    console.log(`📋 Buscando campanhas da conta ${accountId}`)

    // Usar o FacebookAPI para buscar campanhas simples
    const campaigns = await facebookAPI.getSimpleCampaigns(accountId, accessToken)

    console.log(`✅ Encontradas ${campaigns?.length || 0} campanhas`)

    return NextResponse.json({
      success: true,
      campaigns: campaigns || []
    })

  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor'
    }, { status: 500 })
  }
}