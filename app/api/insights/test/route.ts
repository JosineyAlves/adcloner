import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔍 API Test Insights: Iniciando requisição de teste')
  
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const datePreset = searchParams.get('datePreset') || 'last_7d'

    console.log('🔍 API Test Insights: Parâmetros recebidos:', { accountId, datePreset })

    // Simular dados de insights para teste
    const mockInsights = [
      {
        campaign_id: '123456789',
        campaign_name: 'Campanha Teste 1',
        impressions: '1000',
        clicks: '50',
        spend: '100.50',
        reach: '800',
        frequency: '1.25',
        cpm: '100.50',
        cpc: '2.01',
        ctr: '5.00',
        inline_link_clicks: '45',
        inline_post_engagement: '120',
        quality_ranking: 'ABOVE_AVERAGE',
        engagement_rate_ranking: 'AVERAGE',
        conversion_rate_ranking: 'BELOW_AVERAGE',
        conversions: '5',
        cost_per_conversion: '20.10',
        conversion_values: '150.00'
      },
      {
        campaign_id: '987654321',
        campaign_name: 'Campanha Teste 2',
        impressions: '2000',
        clicks: '100',
        spend: '200.00',
        reach: '1500',
        frequency: '1.33',
        cpm: '100.00',
        cpc: '2.00',
        ctr: '5.00',
        inline_link_clicks: '90',
        inline_post_engagement: '250',
        quality_ranking: 'AVERAGE',
        engagement_rate_ranking: 'ABOVE_AVERAGE',
        conversion_rate_ranking: 'AVERAGE',
        conversions: '10',
        cost_per_conversion: '20.00',
        conversion_values: '300.00'
      },
      {
        campaign_id: '555666777',
        campaign_name: 'Campanha Teste 3',
        impressions: '1500',
        clicks: '75',
        spend: '150.00',
        reach: '1200',
        frequency: '1.25',
        cpm: '100.00',
        cpc: '2.00',
        ctr: '5.00',
        inline_link_clicks: '65',
        inline_post_engagement: '180',
        quality_ranking: 'BELOW_AVERAGE',
        engagement_rate_ranking: 'BELOW_AVERAGE',
        conversion_rate_ranking: 'ABOVE_AVERAGE',
        conversions: '8',
        cost_per_conversion: '18.75',
        conversion_values: '240.00'
      }
    ]

    console.log('✅ API Test Insights: Dados simulados criados:', mockInsights.length)
    console.log('📊 API Test Insights: Primeiro insight:', mockInsights[0])
    console.log('📊 API Test Insights: Campos disponíveis:', Object.keys(mockInsights[0]))

    return NextResponse.json({ 
      insights: mockInsights,
      message: 'Dados de teste simulados'
    })
  } catch (error) {
    console.error('❌ API Test Insights: Error:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar dados de teste' },
      { status: 500 }
    )
  }
} 