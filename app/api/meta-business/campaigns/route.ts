import { NextRequest, NextResponse } from 'next/server'
import { FacebookAPI } from '@/lib/facebook-api'
import { MetaCampaign, VideoMetrics } from '@/lib/types'
import { cache } from '@/lib/cache'
import { facebookBatchAPI } from '@/lib/facebook-batch-api'
import { videoMetricsAPI } from '@/lib/video-metrics'
import {
  getRateLimitBlock,
  setRateLimitBlock,
  isRateLimitErrorBody,
  saveLastGood,
  getLastGood,
  retryAfterSecondsFor
} from '@/lib/meta-rate-limit'
import { resolveMetaAccessToken } from '@/lib/meta-connections'

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

// Prioridades de action_type conhecidas pela API de Insights do Meta para cada evento
// (mesmas variantes já tratadas em processConversionValuesMetric/processInitiateCheckoutMetric).
// O Meta reporta o mesmo evento com nomes diferentes dependendo da origem do sinal
// (pixel, App Events, Conversions API, agregado "omni"), então buscar só um nome
// literal (ex.: 'purchase') praticamente nunca bate com o que a API realmente retorna.
const ACTION_TYPE_PRIORITY: Record<string, string[]> = {
  purchase: [
    'omni_purchase',
    'onsite_web_purchase',
    'onsite_web_app_purchase',
    'offsite_conversion.fb_pixel_purchase',
    'web_in_store_purchase',
    'web_app_in_store_purchase',
    'purchase',
  ],
  initiate_checkout: [
    'omni_initiated_checkout',
    'onsite_web_initiate_checkout',
    'offsite_conversion.fb_pixel_initiate_checkout',
    'initiate_checkout',
  ],
}

// Função auxiliar para processar cost_per_action_type (AdsActionStats)
function processCostPerActionType(costPerActionTypeMetric: any, specificActionType?: string): number {
  if (!costPerActionTypeMetric) return 0

  // Se for um array de AdsActionStats, buscar o valor específico
  if (Array.isArray(costPerActionTypeMetric)) {
    if (specificActionType) {
      // Buscar por todas as variantes conhecidas do evento (omni/onsite/offsite/genérico),
      // não só pelo nome literal — evita retornar R$ 0,00 quando o Meta usa outra variante.
      const candidates = ACTION_TYPE_PRIORITY[specificActionType] || [specificActionType]
      let action: any = null
      for (const candidateType of candidates) {
        action = costPerActionTypeMetric.find((item: any) => item.action_type === candidateType)
        if (action) break
      }
      if (action) {
        console.log(`📊 Cost per ${specificActionType} (via ${action.action_type}): ${action.value}`)
        return parseFloat(action.value || '0')
      }
      return 0
    } else {
      // Retornar o primeiro valor (para compatibilidade)
      const firstAction = costPerActionTypeMetric[0]
      if (firstAction) {
        console.log(`📊 Cost per action type (primeiro): ${firstAction.action_type} = ${firstAction.value}`)
        return parseFloat(firstAction.value || '0')
      }
      return 0
    }
  }
  
  // Se for um número simples, retornar diretamente
  return parseFloat(costPerActionTypeMetric.toString() || '0')
}

// Função auxiliar para processar o campo `conversions` (list<AdsActionStats>), que é
// um campo distinto de `results` na API de Insights do Meta e não deve ser confundido com ele.
function processConversionsMetric(conversionsMetric: any): number {
  if (!conversionsMetric) return 0

  if (Array.isArray(conversionsMetric)) {
    return conversionsMetric.reduce((total, action) => {
      return total + parseInt(action.value || '0')
    }, 0)
  }

  return parseInt(conversionsMetric.toString() || '0')
}

// Função auxiliar para processar métricas de resultados (estrutura real da API)
function processResultsMetric(resultsMetric: any): number {
  if (!resultsMetric) return 0
  
  // Se for um array de resultados, processar cada item
  if (Array.isArray(resultsMetric)) {
    console.log(`📊 Processando array de resultados com ${resultsMetric.length} itens:`, resultsMetric)
    return resultsMetric.reduce((total, result) => {
      // Estrutura real: { indicator: "actions:offsite_conversion.fb_pixel_purchase", values: [{ value: "1" }] }
      if (result.values && Array.isArray(result.values)) {
        const resultValue = result.values.reduce((sum: number, valueObj: any) => {
          const value = parseInt(valueObj.value || '0')
          console.log(`  - Indicator: ${result.indicator}, Value: ${value}`)
          return sum + value
        }, 0)
        return total + resultValue
      }
      return total
    }, 0)
  }
  
  // Se for um número simples, retornar diretamente
  return parseInt(resultsMetric.toString() || '0')
}

// Função auxiliar para processar valores monetários de conversão (conversion_values / action_values).
// Conforme a documentação oficial da API de Insights do Meta, o valor de "Valor das Conversões"
// exibido no Gerenciador de Anúncios é a SOMA de todos os itens do array de AdsActionStats
// (cada action_type representa um evento de conversão diferente), sem filtrar por um único
// tipo de ação. Filtrar por "apenas compras" divergia do valor real mostrado no Gerenciador
// de Anúncios sempre que havia outros eventos de conversão configurados (ex.: leads, registros).
function processConversionValuesMetric(valuesMetric: any): number {
  if (!valuesMetric) return 0

  // Se for um array de AdsActionStats, somar TODOS os itens (igual ao Gerenciador de Anúncios)
  if (Array.isArray(valuesMetric)) {
    console.log(`💰 Processando valores monetários com ${valuesMetric.length} itens:`, valuesMetric)

    return valuesMetric.reduce((total, action) => {
      const value = parseFloat(action.value || '0')
      console.log(`  - Action Type: ${action.action_type}, Value: R$ ${value}`)
      return total + value
    }, 0)
  }

  // Se for um número simples, retornar diretamente
  return parseFloat(valuesMetric.toString() || '0')
}

// Função auxiliar para processar inícios de checkout específicos
function processInitiateCheckoutMetric(actionsMetric: any): number {
  if (!actionsMetric) return 0
  
  // Se for um array de ações, processar cada item
  if (Array.isArray(actionsMetric)) {
    console.log(`📊 Processando inícios de checkout com ${actionsMetric.length} ações:`, actionsMetric)
    
    // Buscar ações relacionadas a checkout
    const checkoutActions = actionsMetric.filter((action: any) => 
      action.action_type && (
        action.action_type === 'initiate_checkout' ||
        action.action_type === 'omni_initiated_checkout' ||
        action.action_type === 'offsite_conversion.fb_pixel_initiate_checkout' ||
        action.action_type === 'onsite_web_initiate_checkout'
      )
    )
    
    if (checkoutActions.length > 0) {
      // Priorizar por ordem de importância: omni > onsite > offsite > genérico
      const priorityOrder = [
        'omni_initiated_checkout',
        'onsite_web_initiate_checkout', 
        'offsite_conversion.fb_pixel_initiate_checkout',
        'initiate_checkout'
      ]
      
      let selectedCheckout = null
      for (const priorityType of priorityOrder) {
        selectedCheckout = checkoutActions.find(action => action.action_type === priorityType)
        if (selectedCheckout) break
      }
      
      // Se não encontrou nenhum prioritário, pegar o primeiro
      if (!selectedCheckout) {
        selectedCheckout = checkoutActions[0]
      }
      
      const totalCheckouts = parseInt(selectedCheckout.value || '0')
      
      console.log(`🛒 Checkouts encontrados: ${totalCheckouts} (tipo prioritizado: ${selectedCheckout.action_type})`)
      console.log(`📊 Todos os tipos de checkout encontrados:`, checkoutActions.map(a => `${a.action_type}: ${a.value}`).join(', '))
      
      return totalCheckouts
    }
  }
  
  // Se for um número simples, retornar diretamente
  return parseInt(actionsMetric.toString() || '0')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    // Resolve o token pela conexão dona dessa conta (Supabase) em vez de só o cookie único —
    // necessário porque cada conta pode ter sido conectada com um login/token diferente (ver
    // lib/meta-connections.ts::resolveMetaAccessToken e a seção correspondente do doc do projeto).
    const accessToken = await resolveMetaAccessToken(request.cookies.get('fb_access_token')?.value, accountId)
    const datePreset = searchParams.get('datePreset') || 'today'
    const since = searchParams.get('since')
    const until = searchParams.get('until')
    // Ids das colunas/métricas ativas no seletor do painel (lib/metrics-config.ts). Quando
    // presente, só os campos que essas colunas precisam são pedidos à Meta — ver
    // lib/insights-fields.ts. Entra na chave de cache pra evitar servir, depois de trocar as
    // colunas visíveis, um resultado em cache que foi buscado com um conjunto de campos menor.
    const metricIds = searchParams.get('metricIds')

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
    const cacheKey = cache.generateKey('campaigns', { accountId, datePreset, since, until, metricIds })
    const cachedData = cache.get(cacheKey)
    
    if (cachedData) {
      console.log('📦 Retornando campanhas do cache (TTL inteligente)')
      return NextResponse.json(cachedData)
    }

    // Se essa conta acabou de bater no limite de requisições da Meta, não tentar de novo agora.
    const existingBlock = getRateLimitBlock(accountId)
    if (existingBlock) {
      const stale = getLastGood<any>(cacheKey)
      return NextResponse.json(
        {
          ...(stale?.data || { campaigns: [] }),
          rateLimited: true,
          retryAfterSeconds: retryAfterSecondsFor(accountId),
          message: 'Limite de requisições da Meta atingido para esta conta. Aguarde antes de tentar novamente.'
        },
        { status: 429 }
      )
    }

    try {
      console.log('🚀 Iniciando busca de campanhas com Batch Requests')

      // PASSO 1: Buscar campanhas usando batch request
      const campaignsBatch = facebookBatchAPI.createCampaignsBatch(accountId, datePreset, since || undefined, until || undefined)
      const { responses: campaignsResponses, estimatedWaitMinutes } = await facebookBatchAPI.makeBatchRequest(campaignsBatch, accessToken)

      if (campaignsResponses[0].code !== 200) {
        const errorData = JSON.parse(campaignsResponses[0].body || '{}')
        console.error('❌ Erro ao buscar campanhas:', errorData)

        if (isRateLimitErrorBody(errorData)) {
          setRateLimitBlock(accountId, estimatedWaitMinutes, errorData.error?.message || 'Rate limit da Meta')
          const stale = getLastGood<any>(cacheKey)
          return NextResponse.json(
            {
              ...(stale?.data || { campaigns: [] }),
              rateLimited: true,
              retryAfterSeconds: retryAfterSecondsFor(accountId),
              message: 'Limite de requisições da Meta atingido para esta conta. Aguarde antes de tentar novamente.'
            },
            { status: 429 }
          )
        }

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
        const insightsBatch = facebookBatchAPI.createCampaignInsightsBatch(campaignIds, datePreset, since || undefined, until || undefined, metricIds)
        const { responses: insightsResponses } = await facebookBatchAPI.makeBatchRequest(insightsBatch, accessToken)
        
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
              video_p95_watched_actions: 0,
              video_p100_watched_actions: 0,
              
              // Métricas específicas de campanhas (não disponíveis em adsets/ads)
              cost_per_conversion: 0,
              cost_per_initiate_checkout: 0,
              initiate_checkout: 0,
              cost_per_action_type: 0,
              cost_per_inline_link_click: 0,
              cost_per_landing_page_view: 0,
              conversions: 0,
              conversion_values: 0,
              results: 0,
              conversion_rate_ranking: null as string | null,
              quality_ranking: null as string | null,
              engagement_rate_ranking: null as string | null,
              actions: 0
            }

            if (insightsResponse.code === 200) {
              const insightsData = JSON.parse(insightsResponse.body || '{}')
            if (insightsData.data && insightsData.data.length > 0) {
              const insight = insightsData.data[0]
              // Debug: Log dos valores de reach e frequency
              console.log(`🔍 Campaign ${campaign.id} (${campaign.name}) - Reach da API: ${insight.reach}, Frequency da API: ${insight.frequency}`)
              // Debug: Log das impressões para identificar problema
              console.log(`📊 Campaign ${campaign.id} - Impressões da API: ${insight.impressions}, Cliques: ${insight.clicks}, Gasto: ${insight.spend}`)
              // Debug: Log dos valores de CPC
              console.log(`💰 Campaign ${campaign.id} - CPC: ${insight.cpc}, Cost per unique click: ${insight.cost_per_unique_click}, Cost per unique inline link click: ${insight.cost_per_unique_inline_link_click}`)
              // Debug: Log das métricas de conversão
              console.log(`🔄 Campaign ${campaign.id} - Conversions (raw):`, insight.conversions)
              console.log(`🔄 Campaign ${campaign.id} - Conversion Values (raw):`, insight.conversion_values)
              console.log(`🔄 Campaign ${campaign.id} - Results (raw):`, insight.results)
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
                video_p95_watched_actions: processVideoMetric(insight.video_p95_watched_actions),
                video_p100_watched_actions: processVideoMetric(insight.video_p100_watched_actions),
                
                // Métricas específicas de campanhas (não disponíveis em adsets/ads)
                cost_per_conversion: processCostPerActionType(insight.cost_per_action_type, 'purchase'),
                cost_per_initiate_checkout: processCostPerActionType(insight.cost_per_action_type, 'initiate_checkout'),
                initiate_checkout: processInitiateCheckoutMetric(insight.actions),
                cost_per_action_type: processCostPerActionType(insight.cost_per_action_type),
                cost_per_inline_link_click: parseFloat(insight.cost_per_inline_link_click || '0'),
                cost_per_landing_page_view: processCostPerActionType(insight.cost_per_action_type, 'landing_page_view'),
                  conversions: processConversionsMetric(insight.conversions),
                  conversion_values: processConversionValuesMetric(insight.conversion_values || insight.action_values),
                  results: processResultsMetric(insight.results),
                conversion_rate_ranking: insight.conversion_rate_ranking ?? null,
                quality_ranking: insight.quality_ranking ?? null,
                engagement_rate_ranking: insight.engagement_rate_ranking ?? null,
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
              video_p95_watched_actions: insights.video_p95_watched_actions,
              video_p100_watched_actions: insights.video_p100_watched_actions,
              
              // Métricas específicas de campanhas (não disponíveis em adsets/ads)
              cost_per_conversion: insights.cost_per_conversion,
              cost_per_initiate_checkout: insights.cost_per_initiate_checkout,
              initiate_checkout: insights.initiate_checkout,
              cost_per_action_type: insights.cost_per_action_type,
              cost_per_inline_link_click: insights.cost_per_inline_link_click,
              cost_per_landing_page_view: insights.cost_per_landing_page_view,
              conversions: insights.conversions,
              conversion_values: insights.conversion_values,
              results: insights.results,
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
              video_p95_watched_actions: 0,
              video_p100_watched_actions: 0,
              
              // Métricas específicas de campanhas (não disponíveis em adsets/ads)
              cost_per_conversion: 0,
              cost_per_initiate_checkout: 0,
              initiate_checkout: 0,
              cost_per_action_type: 0,
              cost_per_inline_link_click: 0,
              cost_per_landing_page_view: 0,
              conversions: 0,
              conversion_values: 0,
              results: 0,
              conversion_rate_ranking: null,
              quality_ranking: null,
              engagement_rate_ranking: null,
              actions: 0
            })
          }
        }
      }

      // Remover duplicatas baseado no ID da campanha
      const uniqueCampaigns = campaigns.filter((campaign, index, self) => 
        index === self.findIndex(c => c.id === campaign.id)
      )
      
      console.log(`🔄 Campaigns únicas após remoção de duplicatas: ${uniqueCampaigns.length} (original: ${campaigns.length})`)

      const result = { campaigns: uniqueCampaigns }
      
      // Salvar no cache com TTL inteligente (15 minutos para campanhas)
      cache.setWithIntelligentTTL(cacheKey, result, 'campaigns')
      saveLastGood(cacheKey, result)

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
