import { NextRequest, NextResponse } from 'next/server'
import { FacebookAPI } from '@/lib/facebook-api'
import { MetaCampaign, VideoMetrics } from '@/lib/types'
import { facebookRateLimiter } from '@/lib/rate-limiter'
import { cache } from '@/lib/cache'
import { facebookBatchAPI } from '@/lib/facebook-batch-api'
import { videoMetricsAPI } from '@/lib/video-metrics'

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

    const facebookAPI = new FacebookAPI()
    
    // Verificar cache primeiro com TTL inteligente
    const cacheKey = cache.generateKey('campaigns', { accountId, datePreset, since, until })
    const cachedData = cache.get(cacheKey)
    
    if (cachedData) {
      console.log('📦 Retornando campanhas do cache (TTL inteligente)')
      return NextResponse.json(cachedData)
    }
    
    try {
      console.log('🚀 Iniciando busca de campanhas com Batch Requests')
      
      // PASSO 1: Buscar campanhas usando batch request
      const campaignsBatch = facebookBatchAPI.createCampaignsBatch(accountId, datePreset, since || undefined, until || undefined)
      const campaignsResponses = await facebookBatchAPI.makeBatchRequest(campaignsBatch, accessToken)
      
      if (campaignsResponses[0].code !== 200) {
        const errorData = JSON.parse(campaignsResponses[0].body || '{}')
        console.error('❌ Erro ao buscar campanhas:', errorData)
        return NextResponse.json(
          { error: errorData.error?.message || 'Failed to fetch campaigns' },
          { status: 400 }
        )
      }

      const campaignsData = JSON.parse(campaignsResponses[0].body || '{}')
      const campaigns: MetaCampaign[] = []
      
      if (campaignsData.data && campaignsData.data.length > 0) {
        console.log(`📊 Encontradas ${campaignsData.data.length} campanhas`)
        
        // PASSO 2: Buscar insights em batch (até 50 por vez)
        const campaignIds = campaignsData.data.map((c: any) => c.id)
        const insightsBatch = facebookBatchAPI.createCampaignInsightsBatch(campaignIds, datePreset, since || undefined, until || undefined)
        const insightsResponses = await facebookBatchAPI.makeBatchRequest(insightsBatch, accessToken)
        
        console.log(`📈 Buscando insights para ${campaignIds.length} campanhas em ${Math.ceil(insightsBatch.length / 50)} lotes`)
        
        // PASSO 3: Processar campanhas com insights
        for (let i = 0; i < campaignsData.data.length; i++) {
          const campaign = campaignsData.data[i]
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
              video_p100_watched_actions: 0,
              
              // Métricas específicas de campanhas (não disponíveis em adsets/ads)
              cost_per_conversion: 0,
              cost_per_action_type: 0,
              cost_per_inline_link_click: 0,
              cost_per_landing_page_view: 0,
              conversions: 0,
              conversion_values: 0,
              conversion_rate_ranking: 0,
              quality_ranking: 0,
              engagement_rate_ranking: 0,
              actions: 0
            }

            if (insightsResponse.code === 200) {
              const insightsData = JSON.parse(insightsResponse.body || '{}')
            if (insightsData.data && insightsData.data.length > 0) {
              const insight = insightsData.data[0]
              // Debug: Log dos valores de reach e frequency
              console.log(`🔍 Campaign ${campaign.id} - Reach da API: ${insight.reach}, Frequency da API: ${insight.frequency}`)
              // Debug: Log dos valores de CPC
              console.log(`💰 Campaign ${campaign.id} - CPC: ${insight.cpc}, Cost per unique click: ${insight.cost_per_unique_click}, Cost per unique inline link click: ${insight.cost_per_unique_inline_link_click}`)
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
                video_p100_watched_actions: processVideoMetric(insight.video_p100_watched_actions),
                
                // Métricas específicas de campanhas (não disponíveis em adsets/ads)
                cost_per_conversion: parseFloat(insight.cost_per_conversion || '0'),
                cost_per_action_type: parseFloat(insight.cost_per_action_type || '0'),
                cost_per_inline_link_click: parseFloat(insight.cost_per_inline_link_click || '0'),
                cost_per_landing_page_view: parseFloat(insight.cost_per_landing_page_view || '0'),
                conversions: parseInt(insight.conversions || '0'),
                conversion_values: parseFloat(insight.conversion_values || '0'),
                conversion_rate_ranking: parseFloat(insight.conversion_rate_ranking || '0'),
                quality_ranking: parseFloat(insight.quality_ranking || '0'),
                engagement_rate_ranking: parseFloat(insight.engagement_rate_ranking || '0'),
                actions: parseInt(insight.actions || '0')
              }
              }
            } else {
              console.warn(`⚠️ Erro ao buscar insights da campanha ${campaign.id}:`, insightsResponse)
            }

            // Verificar se tem Advantage Campaign Budget (simplificado)
            const advantageCampaignBudget = !!(campaign.daily_budget || campaign.lifetime_budget)

            // Métricas de vídeo serão implementadas posteriormente
            // Para campanhas, seria necessário buscar anúncios individuais
            const videoMetrics: VideoMetrics | undefined = undefined

            const metaCampaign: MetaCampaign = {
              id: campaign.id,
              name: campaign.name,
              objective: campaign.objective,
              status: campaign.status,
              effective_status: campaign.effective_status || campaign.status,
              daily_budget: campaign.daily_budget ? Math.round(parseInt(campaign.daily_budget) / 100) : undefined,
              lifetime_budget: campaign.lifetime_budget ? Math.round(parseInt(campaign.lifetime_budget) / 100) : undefined,
              budget_type: campaign.daily_budget ? 'daily' : 'lifetime',
              advantage_campaign_budget: advantageCampaignBudget,
              created_time: campaign.created_time,
              updated_time: campaign.updated_time,
              account_id: accountId,
              account_name: 'Facebook Account', // TODO: Buscar nome da conta
              
              // Métricas básicas (disponíveis em todos os níveis)
              spend: insights.spend,
              impressions: insights.impressions,
              clicks: insights.clicks,
              reach: insights.reach,
              frequency: insights.frequency,
              
              // Métricas de custo (disponíveis em todos os níveis)
              cpc: insights.cpc,
              ctr: insights.ctr,
              cpm: insights.cpm,
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
              video_play_actions: insights.video_play_actions,
              video_p25_watched_actions: insights.video_p25_watched_actions,
              video_p50_watched_actions: insights.video_p50_watched_actions,
              video_p75_watched_actions: insights.video_p75_watched_actions,
              video_p100_watched_actions: insights.video_p100_watched_actions,
              
              // Métricas específicas de campanhas (não disponíveis em adsets/ads)
              cost_per_conversion: insights.cost_per_conversion,
              cost_per_action_type: insights.cost_per_action_type,
              cost_per_inline_link_click: insights.cost_per_inline_link_click,
              cost_per_landing_page_view: insights.cost_per_landing_page_view,
              conversions: insights.conversions,
              conversion_values: insights.conversion_values,
              conversion_rate_ranking: insights.conversion_rate_ranking,
              quality_ranking: insights.quality_ranking,
              engagement_rate_ranking: insights.engagement_rate_ranking,
              actions: insights.actions,
              
              // Métricas de vídeo detalhadas
              videoMetrics: videoMetrics
            }

            campaigns.push(metaCampaign)
          } catch (error) {
            console.error(`Error processing campaign ${campaign.id}:`, error)
            // Adicionar campanha sem insights em caso de erro
            const fallbackAdvantageBudget = !!(campaign.daily_budget || campaign.lifetime_budget)
            
            campaigns.push({
              id: campaign.id,
              name: campaign.name,
              objective: campaign.objective,
              status: campaign.status,
              effective_status: campaign.effective_status || campaign.status,
              daily_budget: campaign.daily_budget ? Math.round(parseInt(campaign.daily_budget) / 100) : undefined,
              lifetime_budget: campaign.lifetime_budget ? Math.round(parseInt(campaign.lifetime_budget) / 100) : undefined,
              budget_type: campaign.daily_budget ? 'daily' : 'lifetime',
              advantage_campaign_budget: fallbackAdvantageBudget,
              created_time: campaign.created_time,
              updated_time: campaign.updated_time,
              account_id: accountId,
              account_name: 'Facebook Account',
              
              // Métricas básicas (disponíveis em todos os níveis)
              spend: 0,
              impressions: 0,
              clicks: 0,
              reach: 0,
              frequency: 0,
              
              // Métricas de custo (disponíveis em todos os níveis)
              cpc: 0,
              ctr: 0,
              cpm: 0,
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
              
              // Métricas específicas de campanhas (não disponíveis em adsets/ads)
              cost_per_conversion: 0,
              cost_per_action_type: 0,
              cost_per_inline_link_click: 0,
              cost_per_landing_page_view: 0,
              conversions: 0,
              conversion_values: 0,
              conversion_rate_ranking: 0,
              quality_ranking: 0,
              engagement_rate_ranking: 0,
              actions: 0
            })
          }
        }
      }

      const result = { campaigns }
      
      // Salvar no cache com TTL inteligente (15 minutos para campanhas)
      cache.setWithIntelligentTTL(cacheKey, result, 'campaigns')
      
      console.log(`✅ Campanhas processadas com sucesso: ${campaigns.length} itens`)
      return NextResponse.json(result)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Meta Business campaigns error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
