import { NextRequest, NextResponse } from 'next/server'
import { cache } from '@/lib/cache'
import { facebookBatchAPI } from '@/lib/facebook-batch-api'
import { videoMetricsAPI } from '@/lib/video-metrics'
import { VideoMetrics } from '@/lib/types'

export const dynamic = 'force-dynamic'

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

    try {
      console.log('🚀 Iniciando busca de ads com Batch Requests')
      
      // PASSO 1: Buscar ads usando batch request
      const adsBatch = facebookBatchAPI.createAdsBatch(accountId, datePreset, since || undefined, until || undefined)
      const adsResponses = await facebookBatchAPI.makeBatchRequest(adsBatch, accessToken)
      
      if (adsResponses[0].code !== 200) {
        const errorData = JSON.parse(adsResponses[0].body || '{}')
        console.error('❌ Erro ao buscar ads:', errorData)
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
        const insightsResponses = await facebookBatchAPI.makeBatchRequest(insightsBatch, accessToken)
        
        console.log(`📈 Buscando insights para ${adIds.length} ads em ${Math.ceil(insightsBatch.length / 50)} lotes`)
        
        // PASSO 3: Processar ads com insights
        for (let i = 0; i < adsData.data.length; i++) {
          const ad = adsData.data[i]
          const insightsResponse = insightsResponses[i]
          
          try {
            let insights = {
              impressions: 0,
              clicks: 0,
              spend: 0,
              cpc: 0,
              ctr: 0,
              
              // Métricas de vídeo (apenas as válidas na API de Insights)
              video_play_actions: 0,
              video_play_curve_actions: 0,
              
              // Métricas de vídeo - Porcentagem de visualização
              video_p25_watched_actions: 0,
              video_p50_watched_actions: 0,
              video_p75_watched_actions: 0,
              video_p100_watched_actions: 0,
              
              // Métricas de vídeo - Tempo
              video_30_sec_watched_actions: 0,
              video_avg_time_watched_actions: 0
            }

            if (insightsResponse.code === 200) {
              const insightsData = JSON.parse(insightsResponse.body || '{}')
              if (insightsData.data && insightsData.data.length > 0) {
                const insight = insightsData.data[0]
                insights = {
                  impressions: parseInt(insight.impressions || '0'),
                  clicks: parseInt(insight.clicks || '0'),
                  spend: parseFloat(insight.spend || '0'),
                  cpc: parseFloat(insight.cpc || '0'),
                  ctr: parseFloat(insight.ctr || '0'),
                  
                  // Métricas de vídeo (apenas as válidas na API de Insights)
                  video_play_actions: parseInt(insight.video_play_actions || '0'),
                  video_play_curve_actions: parseInt(insight.video_play_curve_actions || '0'),
                  
                  // Métricas de vídeo - Porcentagem de visualização
                  video_p25_watched_actions: parseInt(insight.video_p25_watched_actions || '0'),
                  video_p50_watched_actions: parseInt(insight.video_p50_watched_actions || '0'),
                  video_p75_watched_actions: parseInt(insight.video_p75_watched_actions || '0'),
                  video_p100_watched_actions: parseInt(insight.video_p100_watched_actions || '0'),
                  
                  // Métricas de vídeo - Tempo
                  video_30_sec_watched_actions: parseInt(insight.video_30_sec_watched_actions || '0'),
                  video_avg_time_watched_actions: parseInt(insight.video_avg_time_watched_actions || '0')
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
              spend: insights.spend,
              impressions: insights.impressions,
              clicks: insights.clicks,
              cpc: insights.cpc,
              ctr: insights.ctr,
              
              // Métricas de vídeo (apenas as válidas na API de Insights)
              video_play_actions: insights.video_play_actions || 0,
              video_play_curve_actions: insights.video_play_curve_actions || 0,
              
              // Métricas de vídeo - Porcentagem de visualização
              video_p25_watched_actions: insights.video_p25_watched_actions || 0,
              video_p50_watched_actions: insights.video_p50_watched_actions || 0,
              video_p75_watched_actions: insights.video_p75_watched_actions || 0,
              video_p100_watched_actions: insights.video_p100_watched_actions || 0,
              
              // Métricas de vídeo - Tempo
              video_30_sec_watched_actions: insights.video_30_sec_watched_actions || 0,
              video_avg_time_watched_actions: insights.video_avg_time_watched_actions || 0,
              
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
              spend: 0,
              impressions: 0,
              clicks: 0,
              cpc: 0,
              ctr: 0,
              
              // Métricas de vídeo (apenas as válidas na API de Insights)
              video_play_actions: 0,
              video_play_curve_actions: 0,
              
              // Métricas de vídeo - Porcentagem de visualização
              video_p25_watched_actions: 0,
              video_p50_watched_actions: 0,
              video_p75_watched_actions: 0,
              video_p100_watched_actions: 0,
              
              // Métricas de vídeo - Tempo
              video_30_sec_watched_actions: 0,
              video_avg_time_watched_actions: 0,
              
              created_time: ad.created_time,
              updated_time: ad.updated_time,
              account_id: accountId,
              account_name: 'Facebook Account'
            })
          }
        }
      }

      const result = { ads }
      
      // Salvar no cache com TTL inteligente (8 minutos para ads)
      cache.setWithIntelligentTTL(cacheKey, result, 'ads')
      
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