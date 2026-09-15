import { NextRequest, NextResponse } from 'next/server'
import { FacebookBatchAPI } from '@/lib/facebook-batch-api'
import { cache } from '@/lib/cache'
import {
  getRateLimitBlock,
  setRateLimitBlock,
  isRateLimitErrorBody,
  saveLastGood,
  getLastGood,
  retryAfterSecondsFor
} from '@/lib/meta-rate-limit'
import { resolveMetaAccessToken } from '@/lib/meta-connections'

const facebookBatchAPI = new FacebookBatchAPI()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId') || searchParams.get('account_id')
    const datePreset = searchParams.get('datePreset') || searchParams.get('date_preset') || 'last_7d'
    const since = searchParams.get('since')
    const until = searchParams.get('until')
    // Ver comentário equivalente em app/api/meta-business/campaigns/route.ts.
    const accessToken = await resolveMetaAccessToken(request.cookies.get('fb_access_token')?.value, accountId)

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 401 }
      )
    }

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    // Verificar cache primeiro com TTL inteligente
    const cacheKey = cache.generateKey('accounts', { accountId, datePreset, since, until })
    const cachedData = cache.get(cacheKey)

    if (cachedData) {
      console.log('📦 Retornando dados da conta do cache (TTL inteligente)')
      return NextResponse.json(cachedData)
    }

    // Se essa conta acabou de bater no limite de requisições da Meta, não tentar de novo agora —
    // a própria doc da Meta recomenda parar de chamar, já que insistir só aumenta o bloqueio.
    // Servimos o último resultado bom conhecido (se houver) para a tela não ficar vazia.
    const existingBlock = getRateLimitBlock(accountId)
    if (existingBlock) {
      const stale = getLastGood<any>(cacheKey)
      return NextResponse.json(
        {
          ...(stale?.data || { accounts: [], totalAccounts: 0, summary: {} }),
          rateLimited: true,
          retryAfterSeconds: retryAfterSecondsFor(accountId),
          message: 'Limite de requisições da Meta atingido para esta conta. Aguarde antes de tentar novamente.'
        },
        { status: 429 }
      )
    }

    try {
      console.log('🚀 Iniciando busca de insights da conta com Batch Requests')

      // PASSO 1: Buscar insights da conta usando batch request
      const accountInsightsBatch = facebookBatchAPI.createAccountInsightsBatch(accountId, datePreset, since || undefined, until || undefined)
      const { responses: accountInsightsResponses, estimatedWaitMinutes } = await facebookBatchAPI.makeBatchRequest(accountInsightsBatch, accessToken)

      if (accountInsightsResponses[0].code !== 200) {
        const errorData = JSON.parse(accountInsightsResponses[0].body || '{}')
        console.error('❌ Erro ao buscar insights da conta:', errorData)

        if (isRateLimitErrorBody(errorData)) {
          setRateLimitBlock(accountId, estimatedWaitMinutes, errorData.error?.message || 'Rate limit da Meta')
          const stale = getLastGood<any>(cacheKey)
          return NextResponse.json(
            {
              ...(stale?.data || { accounts: [], totalAccounts: 0, summary: {} }),
              rateLimited: true,
              retryAfterSeconds: retryAfterSecondsFor(accountId),
              message: 'Limite de requisições da Meta atingido para esta conta. Aguarde antes de tentar novamente.'
            },
            { status: 429 }
          )
        }

        return NextResponse.json(
          { error: errorData.error?.message || 'Failed to fetch account insights' },
          { status: 400 }
        )
      }

      const accountInsightsData = JSON.parse(accountInsightsResponses[0].body || '{}')
      
      if (!accountInsightsData.data || accountInsightsData.data.length === 0) {
        console.log('⚠️ Nenhum dado de insights encontrado para a conta')
        return NextResponse.json({
          accounts: [],
          totalAccounts: 0,
          summary: {
            totalSpend: 0,
            totalImpressions: 0,
            totalClicks: 0,
            totalReach: 0,
            averageFrequency: 0,
            averageCPM: 0,
            averageCPC: 0,
            averageCTR: 0
          }
        })
      }

      // Processar insights da conta
      const insights = accountInsightsData.data[0]
      
      // Debug: Log dos dados completos da API
      console.log(`🔍 Conta ${accountId} - Dados completos da API:`, JSON.stringify(insights, null, 2))
      
      // Criar objeto da conta com insights
      const accountData = {
        id: accountId,
        name: insights.account_name || 'Facebook Account',
        
        // Métricas básicas (disponíveis em todos os níveis)
        spend: parseFloat(insights.spend || '0'),
        impressions: parseInt(insights.impressions || '0'),
        clicks: parseInt(insights.clicks || '0'),
        reach: parseInt(insights.reach || '0'),
        frequency: parseFloat(insights.frequency || '0'),
        
        // Métricas de custo (disponíveis em todos os níveis)
        cpm: parseFloat(insights.cpm || '0'),
        cpc: parseFloat(insights.cpc || '0'),
        ctr: parseFloat(insights.ctr || '0'),
        cost_per_unique_click: parseFloat(insights.cost_per_unique_click || '0'),
        cost_per_unique_inline_link_click: parseFloat(insights.cost_per_unique_inline_link_click || '0'),
        
        // Métricas de engajamento (disponíveis em todos os níveis)
        inline_link_clicks: parseInt(insights.inline_link_clicks || '0'),
        inline_link_click_ctr: parseFloat(insights.inline_link_click_ctr || '0'),
        inline_post_engagement: parseInt(insights.inline_post_engagement || '0'),
        
        // Métricas únicas (disponíveis em todos os níveis)
        unique_clicks: parseInt(insights.unique_clicks || '0'),
        unique_inline_link_clicks: parseInt(insights.unique_inline_link_clicks || '0'),
        unique_inline_link_click_ctr: parseFloat(insights.unique_inline_link_click_ctr || '0'),
        unique_ctr: parseFloat(insights.unique_ctr || '0'),
        
        // Métricas de vídeo (disponíveis em todos os níveis)
        video_play_actions: processVideoMetric(insights.video_play_actions),
        video_p25_watched_actions: processVideoMetric(insights.video_p25_watched_actions),
        video_p50_watched_actions: processVideoMetric(insights.video_p50_watched_actions),
        video_p75_watched_actions: processVideoMetric(insights.video_p75_watched_actions),
        video_p95_watched_actions: processVideoMetric(insights.video_p95_watched_actions),
        video_p100_watched_actions: processVideoMetric(insights.video_p100_watched_actions),
        video_continuous_2_sec_watched_actions: processVideoMetric(insights.video_continuous_2_sec_watched_actions),
        video_time_watched_actions: processVideoMetric(insights.video_time_watched_actions),
        
        // Métricas específicas de contas (level=account)
        cost_per_conversion: parseFloat(insights.cost_per_conversion || '0'),
        cost_per_action_type: parseFloat(insights.cost_per_action_type || '0'),
        cost_per_inline_link_click: parseFloat(insights.cost_per_inline_link_click || '0'),
        cost_per_landing_page_view: parseFloat(insights.cost_per_landing_page_view || '0'),
        cost_per_ad_click: parseFloat(insights.cost_per_ad_click || '0'),
        cost_per_outbound_click: parseFloat(insights.cost_per_outbound_click || '0'),
        cost_per_unique_outbound_click: parseFloat(insights.cost_per_unique_outbound_click || '0'),
        cost_per_thruplay: parseFloat(insights.cost_per_thruplay || '0'),
        cost_per_15_sec_video_view: parseFloat(insights.cost_per_15_sec_video_view || '0'),
        cost_per_2_sec_continuous_video_view: parseFloat(insights.cost_per_2_sec_continuous_video_view || '0'),
        conversions: parseInt(insights.conversions || '0'),
        conversion_values: parseFloat(insights.conversion_values || '0'),
        conversion_rate_ranking: parseFloat(insights.conversion_rate_ranking || '0'),
        quality_ranking: parseFloat(insights.quality_ranking || '0'),
        engagement_rate_ranking: parseFloat(insights.engagement_rate_ranking || '0'),
        actions: parseInt(insights.actions || '0'),
        
        // Informações da conta
        account_currency: insights.account_currency || 'USD',
        date_start: insights.date_start,
        date_stop: insights.date_stop,
        created_time: new Date().toISOString(),
        updated_time: new Date().toISOString()
      }

      // Calcular resumo
      const summary = {
        totalSpend: accountData.spend,
        totalImpressions: accountData.impressions,
        totalClicks: accountData.clicks,
        totalReach: accountData.reach,
        averageFrequency: accountData.frequency,
        averageCPM: accountData.cpm,
        averageCPC: accountData.cpc,
        averageCTR: accountData.ctr,
        totalConversions: accountData.conversions,
        totalConversionValue: accountData.conversion_values
      }

      const result = {
        accounts: [accountData],
        totalAccounts: 1,
        summary
      }

      // Salvar no cache com TTL inteligente
      cache.set(cacheKey, result, 300) // 5 minutos para dados de conta
      saveLastGood(cacheKey, result)

      console.log(`✅ Insights da conta processados com sucesso`)
      return NextResponse.json(result)

    } catch (error) {
      console.error('❌ Erro ao processar insights da conta:', error)
      return NextResponse.json(
        { error: 'Failed to process account insights' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Erro geral na rota de accounts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Função para processar métricas de vídeo
function processVideoMetric(videoMetric: any): number {
  if (!videoMetric) return 0
  
  if (Array.isArray(videoMetric) && videoMetric.length > 0) {
    return parseInt(videoMetric[0].value || '0')
  }
  
  return parseInt(videoMetric || '0')
}
