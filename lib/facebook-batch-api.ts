// Sistema de Batch Requests do Meta API
// Baseado na documentação oficial: https://developers.facebook.com/docs/graph-api/making-multiple-requests

import {
  CAMPAIGN_ALWAYS_FIELDS,
  ADSET_OR_AD_ALWAYS_FIELDS,
  resolveOptionalInsightFields
} from './insights-fields'

interface BatchRequest {
  method: string
  relative_url: string
  body?: string
  name?: string
}

interface BatchResponse {
  code: number
  headers?: Array<{name: string, value: string}>
  body?: string
}

interface RateLimitInfo {
  call_count: number
  total_cputime: number
  total_time: number
  estimated_time_to_regain_access?: number
  ads_api_access_tier?: string
}

export class FacebookBatchAPI {
  private baseUrl = 'https://graph.facebook.com/v23.0'
  private maxBatchSize = 50 // Limite oficial do Meta
  private rateLimitThreshold = 80 // Alertar quando > 80%
  private criticalThreshold = 95 // Pausar quando > 95%

  /**
   * Faz requisições em lote conforme documentação oficial do Meta
   * Limite: 50 requisições por lote
   */
  async makeBatchRequest(
    requests: BatchRequest[],
    accessToken: string
  ): Promise<{ responses: BatchResponse[]; estimatedWaitMinutes: number | null }> {
    // Dividir em lotes de até 50 requisições
    const batches = this.chunkArray(requests, this.maxBatchSize)
    const allResponses: BatchResponse[] = []
    // Maior "estimated_time_to_regain_access" visto nos headers de uso ao longo de todos os
    // lotes desta chamada — repassado pra quem chamou poder decidir bloquear novas tentativas
    // (ver lib/meta-rate-limit.ts), em vez desse dado só ser logado e descartado como antes.
    let estimatedWaitMinutes: number | null = null

    console.log(`🔄 Processando ${requests.length} requisições em ${batches.length} lotes`)

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      console.log(`📦 Processando lote ${i + 1}/${batches.length} (${batch.length} requisições)`)

      try {
        const response = await fetch(`${this.baseUrl}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            batch: JSON.stringify(batch),
            access_token: accessToken,
            include_headers: 'false' // Remover headers para eficiência conforme recomendação
          })
        })

        // Verificar rate limit headers
        const waitMinutesFromThisBatch = this.checkRateLimitHeaders(response)
        if (waitMinutesFromThisBatch !== null) {
          estimatedWaitMinutes = Math.max(estimatedWaitMinutes ?? 0, waitMinutesFromThisBatch)
        }

        const data = await response.json()

        if (Array.isArray(data)) {
          allResponses.push(...data)
        } else {
          console.error('❌ Resposta de batch inválida:', data)
          // Fallback: fazer requisições individuais
          const individualResponses = await this.makeIndividualRequests(batch, accessToken)
          allResponses.push(...individualResponses)
        }
      } catch (error) {
        console.error(`❌ Erro no lote ${i + 1}:`, error)
        // Fallback: fazer requisições individuais
        const individualResponses = await this.makeIndividualRequests(batch, accessToken)
        allResponses.push(...individualResponses)
      }

      // Pequena pausa entre lotes para evitar rate limiting
      if (i < batches.length - 1) {
        await this.delay(100) // 100ms entre lotes
      }
    }

    console.log(`✅ Processamento concluído: ${allResponses.length} respostas`)
    return { responses: allResponses, estimatedWaitMinutes }
  }

  /**
   * Verifica headers de rate limit conforme recomendação oficial do Meta
   * (https://developers.facebook.com/docs/graph-api/overview/rate-limiting/) e retorna o maior
   * "estimated_time_to_regain_access" (em minutos) encontrado, ou null se o header não veio ou
   * nenhum limite estava próximo do teto.
   */
  private checkRateLimitHeaders(response: Response): number | null {
    const usage = response.headers.get('x-business-use-case-usage')
    if (!usage) return null

    let estimatedWaitMinutes: number | null = null

    try {
      const parsed = JSON.parse(usage)

      // Verificar cada business ID
      Object.entries(parsed).forEach(([businessId, limits]) => {
        if (Array.isArray(limits)) {
          limits.forEach((limit: RateLimitInfo) => {
            const callCount = limit.call_count || 0

            if (callCount > this.criticalThreshold) {
              console.error(`🚨 RATE LIMIT CRÍTICO (${businessId}): ${callCount}% - PAUSANDO REQUISIÇÕES`)
            } else if (callCount > this.rateLimitThreshold) {
              console.warn(`⚠️ Rate limit próximo (${businessId}): ${callCount}%`)
            } else {
              console.log(`✅ Rate limit OK (${businessId}): ${callCount}%`)
            }

            // Log de informações adicionais
            if (limit.estimated_time_to_regain_access) {
              console.log(`⏰ Tempo estimado para recuperar acesso: ${limit.estimated_time_to_regain_access} minutos`)
              estimatedWaitMinutes = Math.max(estimatedWaitMinutes ?? 0, limit.estimated_time_to_regain_access)
            }

            if (limit.ads_api_access_tier) {
              console.log(`🎯 Nível de acesso: ${limit.ads_api_access_tier}`)
            }
          })
        }
      })
    } catch (error) {
      console.error('❌ Erro ao analisar headers de rate limit:', error)
    }

    return estimatedWaitMinutes
  }

  /**
   * Fallback: faz requisições individuais em caso de erro no batch
   */
  private async makeIndividualRequests(
    requests: BatchRequest[],
    accessToken: string
  ): Promise<BatchResponse[]> {
    console.log(`🔄 Fallback: fazendo ${requests.length} requisições individuais`)
    const responses: BatchResponse[] = []
    
    for (const request of requests) {
      try {
        const url = `${this.baseUrl}/${request.relative_url}${request.relative_url.includes('?') ? '&' : '?'}access_token=${accessToken}`
        
        const response = await fetch(url, {
          method: request.method,
          body: request.body
        })
        
        const data = await response.json()
        responses.push({
          code: response.status,
          body: JSON.stringify(data)
        })
      } catch (error) {
        console.error(`❌ Erro na requisição individual:`, error)
        responses.push({
          code: 500,
          body: JSON.stringify({ error: 'Request failed' })
        })
      }

      // Pequena pausa entre requisições individuais
      await this.delay(50)
    }
    
    return responses
  }

  /**
   * Divide array em chunks de tamanho específico
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  /**
   * Delay para evitar rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Cria batch de requisições para campanhas
   */
  createCampaignsBatch(accountId: string, datePreset: string, since?: string, until?: string): BatchRequest[] {
    const timeRange = since && until ? `&time_range=${JSON.stringify({since, until})}` : ''
    
    return [
      {
        method: 'GET',
        relative_url: `${accountId}/campaigns?fields=id,name,objective,status,effective_status,daily_budget,lifetime_budget,created_time,updated_time&date_preset=${datePreset}&limit=2500${timeRange}`
      }
    ]
  }

  /**
   * Cria batch de requisições para insights de campanhas.
   * `metricIdsParam` vem do seletor de colunas do painel (ids de lib/metrics-config.ts, ex.:
   * "cpc,reach,conversions") — quando informado, só os campos que essas colunas realmente
   * precisam são pedidos à Meta, além dos campos sempre incluídos (identificação + básicos).
   * Ver lib/insights-fields.ts para o motivo disso reduzir a chance de bater no rate limit.
   */
  createCampaignInsightsBatch(campaignIds: string[], datePreset: string, since?: string, until?: string, metricIdsParam?: string | null): BatchRequest[] {
    const timeRange = since && until ? `&time_range=${JSON.stringify({since, until})}` : ''

    const fields = [
      ...CAMPAIGN_ALWAYS_FIELDS,
      ...resolveOptionalInsightFields(metricIdsParam ?? null)
    ].join(',')

    return campaignIds.map(campaignId => ({
      method: 'GET',
      relative_url: `${campaignId}/insights?fields=${fields}&level=campaign&date_preset=${datePreset}${timeRange}`
    }))
  }

  /**
   * Cria batch de requisições para insights de contas (level=account)
   */
  createAccountInsightsBatch(accountId: string, datePreset: string, since?: string, until?: string): BatchRequest[] {
    const timeRange = since && until ? `&time_range=${JSON.stringify({since, until})}` : ''
    
    // Campos válidos na API de Insights do Facebook para level=account
    const fields = [
      // Identificação básica
      'account_id',
      'account_name',
      'account_currency',
      
      // Métricas básicas
      'impressions',
      'clicks',
      'spend',
      'reach',
      'frequency',
      
      // Métricas de custo (baseado na documentação oficial do Meta)
      'cpm',
      'cpc',
      'ctr',
      'cost_per_conversion',
      'cost_per_action_type',
      'cost_per_inline_link_click',
      'cost_per_unique_click',
      'cost_per_unique_inline_link_click',
      'cost_per_landing_page_view',
      'cost_per_ad_click',
      'cost_per_outbound_click',
      'cost_per_unique_outbound_click',
      'cost_per_thruplay',
      'cost_per_15_sec_video_view',
      'cost_per_2_sec_continuous_video_view',
      
      // Métricas de engajamento (apenas as válidas)
      'inline_link_clicks',
      'inline_link_click_ctr',
      'inline_post_engagement',
      
      // Métricas de conversão
      'results',
      'actions',
      'action_values',
      'conversion_values',
      'conversions',
      'conversion_rate_ranking',
      
      // Métricas de vídeo (baseado na documentação oficial do Meta)
      'video_play_actions',
      'video_p25_watched_actions',
      'video_p50_watched_actions',
      'video_p75_watched_actions',
      'video_p95_watched_actions',
      'video_p100_watched_actions',
      'video_continuous_2_sec_watched_actions',
      'video_time_watched_actions',
      
      // Métricas de qualidade
      'quality_ranking',
      'engagement_rate_ranking',
      
      
      // Métricas de alcance e frequência (apenas as válidas)
      'unique_clicks',
      'unique_inline_link_clicks',
      'unique_inline_link_click_ctr',
      'unique_ctr',
      
      // Campos de data
      'date_start',
      'date_stop'
    ].join(',')
    
    return [{
      method: 'GET',
      relative_url: `${accountId}/insights?fields=${fields}&level=account&date_preset=${datePreset}${timeRange}`
    }]
  }

  /**
   * Cria batch de requisições para ad sets
   */
  createAdSetsBatch(accountId: string, datePreset: string, since?: string, until?: string): BatchRequest[] {
    const timeRange = since && until ? `&time_range=${JSON.stringify({since, until})}` : ''
    
    return [
      {
        method: 'GET',
        relative_url: `${accountId}/adsets?fields=id,name,campaign_id,campaign{id,name},status,effective_status,daily_budget,lifetime_budget,created_time,updated_time&date_preset=${datePreset}&limit=2500${timeRange}`
      }
    ]
  }

  /**
   * Cria batch de requisições para insights de ad sets.
   * `metricIdsParam`: ver comentário em createCampaignInsightsBatch.
   */
  createAdSetInsightsBatch(adSetIds: string[], datePreset: string, since?: string, until?: string, metricIdsParam?: string | null): BatchRequest[] {
    const timeRange = since && until ? `&time_range=${JSON.stringify({since, until})}` : ''

    const fields = [
      ...ADSET_OR_AD_ALWAYS_FIELDS,
      ...resolveOptionalInsightFields(metricIdsParam ?? null)
    ].join(',')

    return adSetIds.map(adSetId => ({
      method: 'GET',
      relative_url: `${adSetId}/insights?fields=${fields}&level=adset&date_preset=${datePreset}${timeRange}`
    }))
  }

  /**
   * Cria batch de requisições para ads
   */
  createAdsBatch(accountId: string, datePreset: string, since?: string, until?: string): BatchRequest[] {
    const timeRange = since && until ? `&time_range=${JSON.stringify({since, until})}` : ''
    
    return [
      {
        method: 'GET',
        relative_url: `${accountId}/ads?fields=id,name,adset_id,adset{id,name},campaign_id,campaign{id,name},status,effective_status,created_time,updated_time&date_preset=${datePreset}&limit=2500${timeRange}`
      }
    ]
  }

  /**
   * Cria batch de requisições para insights de ads.
   * `metricIdsParam`: ver comentário em createCampaignInsightsBatch.
   */
  createAdInsightsBatch(adIds: string[], datePreset: string, since?: string, until?: string, metricIdsParam?: string | null): BatchRequest[] {
    const timeRange = since && until ? `&time_range=${JSON.stringify({since, until})}` : ''

    const fields = [
      ...ADSET_OR_AD_ALWAYS_FIELDS,
      ...resolveOptionalInsightFields(metricIdsParam ?? null)
    ].join(',')

    return adIds.map(adId => ({
      method: 'GET',
      relative_url: `${adId}/insights?fields=${fields}&level=ad&date_preset=${datePreset}${timeRange}`
    }))
  }
}

export const facebookBatchAPI = new FacebookBatchAPI()