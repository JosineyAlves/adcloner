import { NextRequest, NextResponse } from 'next/server'
import { cache } from '@/lib/cache'
import { facebookBatchAPI } from '@/lib/facebook-batch-api'
import { videoMetricsAPI } from '@/lib/video-metrics'
import { VideoMetrics } from '@/lib/types'
import {
  getRateLimitBlock,
  setRateLimitBlock,
  isRateLimitErrorBody,
  saveLastGood,
  getLastGood,
  retryAfterSecondsFor
} from '@/lib/meta-rate-limit'

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
    const cacheKey = cache.generateKey('ads', { accountId, datePreset, since, until })
    const cachedData = cache.get(cacheKey)
    
    if (cachedData) {
      console.log('📦 Retornando ads do cache (TTL inteligente)')
      return NextResponse.json(cachedData)
    }

    // Se essa conta acabou de bater no limite de requisições da Meta, não tentar de novo agora.
    const existingBlock = getRateLimitBlock(accountId)
    if (existingBlock) {
      const stale = getLastGood<any>(cacheKey)
      return NextResponse.json(
        {
          ...(stale?.data || { ads: [] }),
          rateLimited: true,
          retryAfterSeconds: retryAfterSecondsFor(accountId),
          message: 'Limite de requisições da Meta atingido para esta conta. Aguarde antes de tentar novamente.'
        },
        { status: 429 }
      )
    }

    try {
      console.log('🚀 Iniciando busca de ads com Batch Requests')

      // PASSO 1: Buscar ads usando batch request
      const adsBatch = facebookBatchAPI.createAdsBatch(accountId, datePreset, since || undefined, until || undefined)
      const { responses: adsResponses, estimatedWaitMinutes } = await facebookBatchAPI.makeBatchRequest(adsBatch, accessToken)

      if (adsResponses[0].code !== 200) {
        const errorData = JSON.parse(adsResponses[0].body || '{}')
        console.error('❌ Erro ao buscar ads:', errorData)

        if (isRateLimitErrorBody(errorData)) {
          setRateLimitBlock(accountId, estimatedWaitMinutes, errorData.error?.message || 'Rate limit da Meta')
          const stale = getLastGood<any>(cacheKey)
          return NextResponse.json(
            {
              ...(stale?.data || { ads: [] }),
              rateLimited: true,
              retryAfterSeconds: retryAfterSecondsFor(accountId),
              message: 'Limite de requisições da Meta atingido para esta conta. Aguarde antes de tentar novamente.'
            },
            { status: 429 }
          )
        }

        return NextResponse.json(
          { error: errorData.error?.message || 'Failed to fetch ads' },
          { status: 400 }
        )
      }

      const adsData = JSON.parse(adsResponses[0].body || '{}')
      const ads: any[] = []

      if (adsData.data && adsData.data.length > 0) {
        console.log(`📊 Encontrados ${adsData.data.length} ads`)

        // PASSO 2: Buscar insights em batch (até 50 por vez)
        const adIds = adsData.data.map((ad: any) => ad.id)
        const insightsBatch = facebookBatchAPI.createAdInsightsBatch(adIds, datePreset, since || undefined, until || undefined)
        const { responses: insightsResponses } = await facebookBatchAPI.makeBatchRequest(insightsBatch, accessToken)
        
        console.log(`📈 Buscando insights para ${adIds.length} ads em ${Math.ceil(insightsBatch.length / 50)} lotes`)
        
        // PASSO 3: Processar ads com insights
        for (let i = 0; i < adsData.data.length; i++) {
          const ad = adsData.data[i]
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
                    cost_per_inline_link_click: 0,
                    cost_per_conversion: 0,
                    cost_per_initiate_checkout: 0,
                    initiate_checkout: 0,
                    cost_per_landing_page_view: 0,
                    conversions: 0,
                    conversion_values: 0,
                    results: 0,
                    
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
                    video_p100_watched_actions: 0
                  }

            if (insightsResponse.code === 200) {
              const insightsData = JSON.parse(insightsResponse.body || '{}')
                  if (insightsData.data && insightsData.data.length > 0) {
                    const insight = insightsData.data[0]
                    // Debug: Log dos valores de reach e frequency
                    console.log(`🔍 Ad ${ad.id} (${ad.name}) - Reach da API: ${insight.reach}, Frequency da API: ${insight.frequency}`)
                    // Debug: Log das impressões para identificar problema
                    console.log(`📊 Ad ${ad.id} - Impressões da API: ${insight.impressions}, Cliques: ${insight.clicks}, Gasto: ${insight.spend}`)
                    // Debug: Log das métricas de conversão
                    console.log(`🔄 Ad ${ad.id} - Conversions (raw):`, insight.conversions)
                    console.log(`🔄 Ad ${ad.id} - Conversion Values (raw):`, insight.conversion_values)
                    console.log(`🔄 Ad ${ad.id} - Results (raw):`, insight.results)
                    // Debug: Log dos valores de CPC
                    console.log(`💰 Ad ${ad.id} - CPC: ${insight.cpc}, Cost per unique click: ${insight.cost_per_unique_click}, Cost per unique inline link click: ${insight.cost_per_unique_inline_link_click}`)
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
                      cost_per_inline_link_click: parseFloat(insight.cost_per_inline_link_click || '0'),
                      cost_per_conversion: processCostPerActionType(insight.cost_per_action_type, 'purchase'),
                      cost_per_initiate_checkout: processCostPerActionType(insight.cost_per_action_type, 'initiate_checkout'),
                      initiate_checkout: processInitiateCheckoutMetric(insight.actions),
                      cost_per_landing_page_view: processCostPerActionType(insight.cost_per_action_type, 'landing_page_view'),
                      conversions: processConversionsMetric(insight.conversions),
                      conversion_values: processConversionValuesMetric(insight.conversion_values || insight.action_values),
                      results: processResultsMetric(insight.results),
                      
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
                      video_p100_watched_actions: processVideoMetric(insight.video_p100_watched_actions)
                    }
              }
            } else {
              console.warn(`⚠️ Erro ao buscar insights do ad ${ad.id}:`, insightsResponse)
            }

            // Buscar métricas de vídeo para o anúncio
            let videoMetrics: VideoMetrics | undefined = undefined
            try {
              // Verificar se o anúncio tem um vídeo
              if (ad.creative?.video_id) {
                const videoInsights = await videoMetricsAPI.getVideoInsights(ad.creative.video_id, accessToken)
                if (videoInsights.video_views > 0) {
                  // Calcular KPIs de vídeo
                  const videoKPIs = videoMetricsAPI.calculateVideoKPIs(
                    videoInsights,
                    insights.impressions,
                    insights.clicks,
                    0 // conversions não disponível na API de ads
                  )
                  
                  videoMetrics = {
                    ...videoInsights,
                    ...videoKPIs
                  }
                }
              }
            } catch (error) {
              console.warn(`⚠️ Erro ao buscar métricas de vídeo do ad ${ad.id}:`, error)
                  }

                  const metaAd = {
                    id: ad.id,
                    name: ad.name,
                    adset_id: ad.adset_id || ad.adset?.id || '',
                    adset_name: ad.adset?.name || '',
              campaign_id: ad.campaign_id || ad.campaign?.id || '',
              campaign_name: ad.campaign?.name || '',
                    status: ad.status,
                    effective_status: ad.effective_status || ad.status,
                    creative: {
                title: ad.creative?.title || '',
                body: ad.creative?.body || '',
                image_url: ad.creative?.image_url || '',
                video_id: ad.creative?.video_id || '',
                link_url: ad.creative?.link_url || '',
                call_to_action_type: ad.creative?.call_to_action_type || 'LEARN_MORE'
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
                    cost_per_inline_link_click: insights.cost_per_inline_link_click,
                    cost_per_conversion: insights.cost_per_conversion,
                    cost_per_initiate_checkout: insights.cost_per_initiate_checkout,
                    initiate_checkout: insights.initiate_checkout,
                    cost_per_landing_page_view: insights.cost_per_landing_page_view,
                    conversions: insights.conversions,
                    conversion_values: insights.conversion_values,
                    results: insights.results,
                    
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
                    video_p95_watched_actions: insights.video_p95_watched_actions || 0,
                    video_p100_watched_actions: insights.video_p100_watched_actions || 0,
              
              // Métricas de vídeo detalhadas
              videoMetrics: videoMetrics,
              
                    created_time: ad.created_time,
                    updated_time: ad.updated_time,
                    account_id: accountId,
                    account_name: 'Facebook Account'
                  }

                  ads.push(metaAd)
                } catch (error) {
                  console.error(`Error processing ad ${ad.id}:`, error)
            // Adicionar ad sem insights em caso de erro
            ads.push({
              id: ad.id,
              name: ad.name,
              adset_id: ad.adset?.id || '',
              adset_name: ad.adset?.name || '',
              campaign_id: ad.campaign?.id || '',
              campaign_name: ad.campaign?.name || '',
              status: ad.status,
              effective_status: ad.effective_status || ad.status,
              creative: {
                title: ad.creative?.title || '',
                body: ad.creative?.body || '',
                image_url: ad.creative?.image_url || '',
                video_id: ad.creative?.video_id || '',
                link_url: ad.creative?.link_url || '',
                call_to_action_type: ad.creative?.call_to_action_type || 'LEARN_MORE'
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
              cost_per_inline_link_click: 0,
              cost_per_conversion: 0,
              cost_per_initiate_checkout: 0,
              initiate_checkout: 0,
              cost_per_landing_page_view: 0,
              conversions: 0,
              conversion_values: 0,
              results: 0,
              
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
              
              created_time: ad.created_time,
              updated_time: ad.updated_time,
              account_id: accountId,
              account_name: 'Facebook Account'
            })
          }
        }
      }

      // Remover duplicatas baseado no ID do anúncio
      const uniqueAds = ads.filter((ad, index, self) => 
        index === self.findIndex(a => a.id === ad.id)
      )
      
      console.log(`🔄 Ads únicos após remoção de duplicatas: ${uniqueAds.length} (original: ${ads.length})`)

      const result = { ads: uniqueAds }
      
      // Salvar no cache com TTL inteligente (8 minutos para ads)
      cache.setWithIntelligentTTL(cacheKey, result, 'ads')
      saveLastGood(cacheKey, result)

      console.log(`✅ Ads processados com sucesso: ${ads.length} itens`)
      return NextResponse.json(result)
    } catch (error) {
      console.error('Error fetching ads:', error)
      return NextResponse.json(
        { error: 'Failed to fetch ads' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Meta Business ads error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}