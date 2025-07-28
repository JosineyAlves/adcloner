import { NextRequest, NextResponse } from 'next/server'
import { FacebookAPI } from '@/lib/facebook-api'

const facebookAPI = new FacebookAPI()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const campaignId = searchParams.get('campaignId')
    const datePreset = searchParams.get('datePreset') || 'last_7d'
    const level = searchParams.get('level') || 'campaign'
    const breakdowns = searchParams.get('breakdowns')?.split(',') || []

    // Obter token do cookie
    const accessToken = request.cookies.get('fb_access_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'Token de acesso não encontrado' }, { status: 401 })
    }

    let insights

    if (campaignId) {
      // Insights de campanha específica
      insights = await facebookAPI.getCampaignInsights(campaignId, accessToken, datePreset, level)
    } else if (accountId) {
      // Insights de conta de anúncios
      insights = await facebookAPI.getAccountInsights(accountId, accessToken, datePreset)
    } else {
      return NextResponse.json({ error: 'accountId ou campaignId é obrigatório' }, { status: 400 })
    }

    // Se breakdowns foram solicitados
    if (breakdowns.length > 0 && (campaignId || accountId)) {
      const objectId = campaignId || accountId
      const breakdownInsights = await facebookAPI.getInsightsWithBreakdowns(
        objectId!,
        accessToken,
        breakdowns,
        datePreset
      )
      
      return NextResponse.json({
        insights,
        breakdowns: breakdownInsights
      })
    }

    return NextResponse.json({ insights })
  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar insights' },
      { status: 500 }
    )
  }
} 