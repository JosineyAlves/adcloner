import { NextRequest, NextResponse } from 'next/server'
import { facebookRateLimiter } from '@/lib/rate-limiter'
import { cache } from '@/lib/cache'
import { facebookBatchAPI } from '@/lib/facebook-batch-api'
import { videoMetricsAPI } from '@/lib/video-metrics'
import { VideoMetrics } from '@/lib/types'

export const dynamic = 'force-dynamic'

// Função para processar métricas de vídeo que retornam arrays de AdsActionStats
function processVideoMetric(videoMetric: any): number {
  if (!videoMetric) return 0
  
  // Se for um array de AdsActionStats, somar os valores
  if (Array.isArray(videoMetric)) {
    return videoMetric.reduce((total, action) => {
      return total + parseInt(action.value || '0')
    }, 0)
  }
  
  // Se for um número simples, retornar diretamente
  return parseInt(videoMetric.toString() || '0')
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('fb_access_token')?.value
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const datePreset = searchParams.get('datePreset') || 'today'
    const since = searchParams.get('since')
    const until = searchParams.get('until')

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found' },
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
    const cacheKey = cache.generateKey('adsets', { accountId, datePreset, since, until })
    const cachedData = cache.get(cacheKey)
    
    if (cachedData) {
      console.log('📦 Retornando ad sets do cache (TTL inteligente)')
      return NextResponse.json(cachedData)
    }

    try {
      console.log('🚀 Iniciando busca de ad sets com Batch Requests')
      
      // PASSO 1: Buscar ad sets usando batch request
      const adSetsBatch = facebookBatchAPI.createAdSetsBatch(accountId, datePreset, since || undefined, until || undefined)
      const adSetsResponses = await facebookBatchAPI.makeBatchRequest(adSetsBatch, accessToken)
      
      if (adSetsResponses[0].code !== 200) {
        const errorData = JSON.parse(adSetsResponses[0].body || '{}')
        console.error('❌ Erro ao buscar ad sets:', errorData)
        return NextResponse.json(
          { error: errorData.error?.message || 'Failed to fetch ad sets' },
          { status: 400 }
        )
      }

      const adSetsData = JSON.parse(adSetsResponses[0].body || '{}')
      const adSets: any[] = []
      
      if (adSetsData.data && adSetsData.data.length > 0) {
        console.log(`📊 Encontrados ${adSetsData.data.length} ad sets`)
        
        // PASSO 2: Buscar insights em batch (até 50 por vez)
        const adSetIds = adSetsData.data.map((ads: any) => ads.id)
        const insightsBatch = facebookBatchAPI.createAdSetInsightsBatch(adSetIds, datePreset, since || undefined, until || undefined)
        const insightsResponses = await facebookBatchAPI.makeBatchRequest(insightsBatch, accessToken)
        
        console.log(`📈 Buscando insights para ${adSetIds.length} ad sets em ${Math.ceil(insightsBatch.length / 50)} lotes`)
        
        // PASSO 3: Processar ad sets com insights
        for (let i = 0; i < adSetsData.data.length; i++) {
          const adSet = adSetsData.data[i]
          const insightsResponse = insightsResponses[i]
          
          try {
            let insights = {
              // Métricas básicas (disponíveis em todos os níveis)
              impressions: 0,
              clicks: 0,
              spend: 0,
              reach: 0,
              frequency: 0,
              
              // Métricas de custo (disponíveis em todos os níveis)
              cpm: 0,
              cpc: 0,
              ctr: 0,
              cost_per_unique_click: 0,
              cost_per_unique_inline_link_click: 0,
              
              // Métricas de engajamento (disponíveis em todos os níveis)
              inline_link_clicks: 0,
              inline_link_click_ctr: 0,
              inline_post_engagement: 0,
              
              // Métricas únicas (disponíveis em todos os níveis)
              unique_clicks: 0,
              unique_inline_link_clicks: 0,
              unique_inline_link_click_ctr: 0,
              unique_ctr: 0,
              
              // Métricas de vídeo (disponíveis em todos os níveis)
              video_play_actions: 0,
              video_p25_watched_actions: 0,
              video_p50_watched_actions: 0,
              video_p75_watched_actions: 0,
              video_p100_watched_actions: 0
            }

            if (insightsResponse.code === 200) {
              const insightsData = JSON.parse(insightsResponse.body || '{}')
              if (insightsData.data && insightsData.data.length > 0) {
                const insight = insightsData.data[0]
                // Debug: Log dos valores de reach e frequency
                console.log(`🔍 AdSet ${adSet.id} - Reach da API: ${insight.reach}, Frequency da API: ${insight.frequency}`)
                // Debug: Log dos valores de CPC
                console.log(`💰 AdSet ${adSet.id} - CPC: ${insight.cpc}, Cost per unique click: ${insight.cost_per_unique_click}, Cost per unique inline link click: ${insight.cost_per_unique_inline_link_click}`)
                insights = {
                  // Métricas básicas (disponíveis em todos os níveis)
                  impressions: parseInt(insight.impressions || '0'),
                  clicks: parseInt(insight.clicks || '0'),
                  spend: parseFloat(insight.spend || '0'),
                  reach: parseInt(insight.reach || '0'),
                  frequency: parseFloat(insight.frequency || '0'),
                  
                  // Métricas de custo (disponíveis em todos os níveis)
                  cpm: parseFloat(insight.cpm || '0'),
                  cpc: parseFloat(insight.cpc || '0'),
                  ctr: parseFloat(insight.ctr || '0'),
                  cost_per_unique_click: parseFloat(insight.cost_per_unique_click || '0'),
                  cost_per_unique_inline_link_click: parseFloat(insight.cost_per_unique_inline_link_click || '0'),
                  
                  // Métricas de engajamento (disponíveis em todos os níveis)
                  inline_link_clicks: parseInt(insight.inline_link_clicks || '0'),
                  inline_link_click_ctr: parseFloat(insight.inline_link_click_ctr || '0'),
                  inline_post_engagement: parseInt(insight.inline_post_engagement || '0'),
                  
                  // Métricas únicas (disponíveis em todos os níveis)
                  unique_clicks: parseInt(insight.unique_clicks || '0'),
                  unique_inline_link_clicks: parseInt(insight.unique_inline_link_clicks || '0'),
                  unique_inline_link_click_ctr: parseFloat(insight.unique_inline_link_click_ctr || '0'),
                  unique_ctr: parseFloat(insight.unique_ctr || '0'),
                  
                  // Métricas de vídeo (disponíveis em todos os níveis)
                  video_play_actions: processVideoMetric(insight.video_play_actions),
                  video_p25_watched_actions: processVideoMetric(insight.video_p25_watched_actions),
                  video_p50_watched_actions: processVideoMetric(insight.video_p50_watched_actions),
                  video_p75_watched_actions: processVideoMetric(insight.video_p75_watched_actions),
                  video_p100_watched_actions: processVideoMetric(insight.video_p100_watched_actions)
                }
              }
            } else {
              console.warn(`⚠️ Erro ao buscar insights do ad set ${adSet.id}:`, insightsResponse)
            }

            // Verificar se a campanha pai usa CBO (simplificado)
            const campaignAdvantageBudget = false // Assumir ABO por padrão para evitar rate limit

            // Buscar métricas de vídeo para o adset
            let videoMetrics: VideoMetrics | undefined = undefined
            try {
              // Para adsets, precisamos buscar os anúncios primeiro para encontrar vídeos
              // Por simplicidade, vamos assumir que não há vídeos em adsets por enquanto
              // A implementação completa exigiria buscar anúncios individuais
            } catch (error) {
              console.warn(`⚠️ Erro ao buscar métricas de vídeo do adset ${adSet.id}:`, error)
            }

            const metaAdSet = {
              id: adSet.id,
              name: adSet.name,
              campaign_id: adSet.campaign?.id || '',
              campaign_name: adSet.campaign?.name || '',
              campaign_advantage_budget: campaignAdvantageBudget,
              status: adSet.status,
              effective_status: adSet.effective_status || adSet.status,
              daily_budget: adSet.daily_budget ? Math.round(parseInt(adSet.daily_budget) / 100) : undefined,
              lifetime_budget: adSet.lifetime_budget ? Math.round(parseInt(adSet.lifetime_budget) / 100) : undefined,
              budget_type: adSet.daily_budget ? 'daily' : 'lifetime',
              bid_amount: adSet.bid_amount ? parseFloat(adSet.bid_amount) : undefined,
              targeting: {
                age_min: adSet.targeting?.age_min || 18,
                age_max: adSet.targeting?.age_max || 65,
                geo_locations: adSet.targeting?.geo_locations || {},
                interests: adSet.targeting?.interests || []
              },
              // Métricas básicas (disponíveis em todos os níveis)
              spend: insights.spend,
              impressions: insights.impressions,
              clicks: insights.clicks,
              reach: insights.reach,
              frequency: insights.frequency,
              
              // Métricas de custo (disponíveis em todos os níveis)
              cpm: insights.cpm,
              cpc: insights.cpc,
              ctr: insights.ctr,
              cost_per_unique_click: insights.cost_per_unique_click,
              cost_per_unique_inline_link_click: insights.cost_per_unique_inline_link_click,
              
              // Métricas de engajamento (disponíveis em todos os níveis)
              inline_link_clicks: insights.inline_link_clicks,
              inline_link_click_ctr: insights.inline_link_click_ctr,
              inline_post_engagement: insights.inline_post_engagement,
              
              // Métricas únicas (disponíveis em todos os níveis)
              unique_clicks: insights.unique_clicks,
              unique_inline_link_clicks: insights.unique_inline_link_clicks,
              unique_inline_link_click_ctr: insights.unique_inline_link_click_ctr,
              unique_ctr: insights.unique_ctr,
              
              // Métricas de vídeo (disponíveis em todos os níveis)
              video_play_actions: insights.video_play_actions || 0,
              video_p25_watched_actions: insights.video_p25_watched_actions || 0,
              video_p50_watched_actions: insights.video_p50_watched_actions || 0,
              video_p75_watched_actions: insights.video_p75_watched_actions || 0,
              video_p100_watched_actions: insights.video_p100_watched_actions || 0,
              
              // Métricas de vídeo detalhadas
              videoMetrics: videoMetrics,
              
              created_time: adSet.created_time,
              updated_time: adSet.updated_time,
              account_id: accountId,
              account_name: 'Facebook Account'
            }

            adSets.push(metaAdSet)
          } catch (error) {
            console.error(`Error processing ad set ${adSet.id}:`, error)
            // Adicionar ad set sem insights em caso de erro
            adSets.push({
              id: adSet.id,
              name: adSet.name,
              campaign_id: adSet.campaign?.id || '',
              campaign_name: adSet.campaign?.name || '',
              campaign_advantage_budget: false,
              status: adSet.status,
              effective_status: adSet.effective_status || adSet.status,
              daily_budget: adSet.daily_budget ? Math.round(parseInt(adSet.daily_budget) / 100) : undefined,
              lifetime_budget: adSet.lifetime_budget ? Math.round(parseInt(adSet.lifetime_budget) / 100) : undefined,
              budget_type: adSet.daily_budget ? 'daily' : 'lifetime',
              bid_amount: adSet.bid_amount ? parseFloat(adSet.bid_amount) : undefined,
              targeting: {
                age_min: adSet.targeting?.age_min || 18,
                age_max: adSet.targeting?.age_max || 65,
                geo_locations: adSet.targeting?.geo_locations || {},
                interests: adSet.targeting?.interests || []
              },
              // Métricas básicas (disponíveis em todos os níveis)
              spend: 0,
              impressions: 0,
              clicks: 0,
              reach: 0,
              frequency: 0,
              
              // Métricas de custo (disponíveis em todos os níveis)
              cpm: 0,
              cpc: 0,
              ctr: 0,
              cost_per_unique_click: 0,
              cost_per_unique_inline_link_click: 0,
              
              // Métricas de engajamento (disponíveis em todos os níveis)
              inline_link_clicks: 0,
              inline_link_click_ctr: 0,
              inline_post_engagement: 0,
              
              // Métricas únicas (disponíveis em todos os níveis)
              unique_clicks: 0,
              unique_inline_link_clicks: 0,
              unique_inline_link_click_ctr: 0,
              unique_ctr: 0,
              
              // Métricas de vídeo (disponíveis em todos os níveis)
              video_play_actions: 0,
              video_p25_watched_actions: 0,
              video_p50_watched_actions: 0,
              video_p75_watched_actions: 0,
              video_p100_watched_actions: 0,
              
              created_time: adSet.created_time,
              updated_time: adSet.updated_time,
              account_id: accountId,
              account_name: 'Facebook Account'
            })
          }
        }
      }

      const result = { adSets }
      
      // Salvar no cache com TTL inteligente (10 minutos para ad sets)
      cache.setWithIntelligentTTL(cacheKey, result, 'adsets')
      
      console.log(`✅ Ad sets processados com sucesso: ${adSets.length} itens`)
      return NextResponse.json(result)
    } catch (error) {
      console.error('Error fetching ad sets:', error)
      return NextResponse.json(
        { error: 'Failed to fetch ad sets' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Meta Business ad sets error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}