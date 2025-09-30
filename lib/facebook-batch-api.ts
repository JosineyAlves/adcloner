// Sistema de Batch Requests do Meta API
// Baseado na documentação oficial: https://developers.facebook.com/docs/graph-api/making-multiple-requests

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
  ): Promise<BatchResponse[]> {
    // Dividir em lotes de até 50 requisições
    const batches = this.chunkArray(requests, this.maxBatchSize)
    const allResponses: BatchResponse[] = []

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
        this.checkRateLimitHeaders(response)

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
    return allResponses
  }

  /**
   * Verifica headers de rate limit conforme recomendação oficial do Meta
   */
  private checkRateLimitHeaders(response: Response): void {
    const usage = response.headers.get('x-business-use-case-usage')
    if (usage) {
      try {
        const parsed = JSON.parse(usage)
        
        // Verificar cada business ID
        Object.entries(parsed).forEach(([businessId, limits]) => {
          if (Array.isArray(limits)) {
            limits.forEach((limit: RateLimitInfo) => {
              const callCount = limit.call_count || 0
              
              if (callCount > this.criticalThreshold) {
                console.error(`🚨 RATE LIMIT CRÍTICO (${businessId}): ${callCount}% - PAUSANDO REQUISIÇÕES`)
                // Aqui poderia implementar um sistema de pausa global
              } else if (callCount > this.rateLimitThreshold) {
                console.warn(`⚠️ Rate limit próximo (${businessId}): ${callCount}%`)
              } else {
                console.log(`✅ Rate limit OK (${businessId}): ${callCount}%`)
              }

              // Log de informações adicionais
              if (limit.estimated_time_to_regain_access) {
                console.log(`⏰ Tempo estimado para recuperar acesso: ${limit.estimated_time_to_regain_access} minutos`)
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
    }
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
        relative_url: `${accountId}/campaigns?fields=id,name,objective,status,effective_status,daily_budget,lifetime_budget,created_time,updated_time&date_preset=${datePreset}${timeRange}`
      }
    ]
  }

  /**
   * Cria batch de requisições para insights de campanhas
   */
  createCampaignInsightsBatch(campaignIds: string[], datePreset: string, since?: string, until?: string): BatchRequest[] {
    const timeRange = since && until ? `&time_range=${JSON.stringify({since, until})}` : ''
    
    // Campos válidos na API de Insights do Facebook (apenas os suportados oficialmente)
    const fields = [
      // Identificação básica
      'campaign_id',
      'campaign_name',
      'adset_id',
      'adset_name',
      'ad_id',
      'ad_name',
      
      // Métricas básicas
      'impressions',
      'clicks',
      'spend',
      'reach',
      'frequency',
      
      // Métricas de custo
      'cpm',
      'cpc',
      'ctr',
      'cost_per_conversion',
      'cost_per_action_type',
      'cost_per_inline_link_click',
      'cost_per_unique_click',
      'cost_per_landing_page_view',
      
      // Métricas de engajamento (apenas as válidas)
      'inline_link_clicks',
      'inline_post_engagement',
      
      // Métricas de conversão
      'conversions',
      'conversion_values',
      'conversion_rate_ranking',
      
      // Métricas de vídeo (apenas as válidas na API de Insights)
      'video_play_actions',
      'video_play_curve_actions',
      
      // Métricas de qualidade
      'quality_ranking',
      'engagement_rate_ranking',
      
      // Métricas de ações (apenas as válidas)
      'actions',
      
      // Métricas de alcance e frequência (apenas as válidas)
      'unique_clicks',
      'unique_inline_link_clicks',
      'unique_ctr'
    ].join(',')
    
    return campaignIds.map(campaignId => ({
      method: 'GET',
      relative_url: `${campaignId}/insights?fields=${fields}&level=campaign&date_preset=${datePreset}${timeRange}`
    }))
  }

  /**
   * Cria batch de requisições para ad sets
   */
  createAdSetsBatch(accountId: string, datePreset: string, since?: string, until?: string): BatchRequest[] {
    const timeRange = since && until ? `&time_range=${JSON.stringify({since, until})}` : ''
    
    return [
      {
        method: 'GET',
        relative_url: `${accountId}/adsets?fields=id,name,campaign_id,status,effective_status,daily_budget,lifetime_budget,created_time,updated_time&date_preset=${datePreset}${timeRange}`
      }
    ]
  }

  /**
   * Cria batch de requisições para insights de ad sets
   */
  createAdSetInsightsBatch(adSetIds: string[], datePreset: string, since?: string, until?: string): BatchRequest[] {
    const timeRange = since && until ? `&time_range=${JSON.stringify({since, until})}` : ''
    
    // Campos válidos na API de Insights do Facebook (apenas os suportados oficialmente)
    const fields = [
      // Identificação básica
      'campaign_id',
      'campaign_name',
      'adset_id',
      'adset_name',
      'ad_id',
      'ad_name',
      
      // Métricas básicas
      'impressions',
      'clicks',
      'spend',
      'reach',
      'frequency',
      
      // Métricas de custo
      'cpm',
      'cpc',
      'ctr',
      'cost_per_conversion',
      'cost_per_action_type',
      'cost_per_inline_link_click',
      'cost_per_unique_click',
      'cost_per_landing_page_view',
      
      // Métricas de engajamento (apenas as válidas)
      'inline_link_clicks',
      'inline_post_engagement',
      
      // Métricas de conversão
      'conversions',
      'conversion_values',
      'conversion_rate_ranking',
      
      // Métricas de vídeo (apenas as válidas na API de Insights)
      'video_play_actions',
      'video_play_curve_actions',
      
      // Métricas de qualidade
      'quality_ranking',
      'engagement_rate_ranking',
      
      // Métricas de ações (apenas as válidas)
      'actions',
      
      // Métricas de alcance e frequência (apenas as válidas)
      'unique_clicks',
      'unique_inline_link_clicks',
      'unique_ctr'
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
        relative_url: `${accountId}/ads?fields=id,name,adset_id,campaign_id,status,effective_status,created_time,updated_time&date_preset=${datePreset}${timeRange}`
      }
    ]
  }

  /**
   * Cria batch de requisições para insights de ads
   */
  createAdInsightsBatch(adIds: string[], datePreset: string, since?: string, until?: string): BatchRequest[] {
    const timeRange = since && until ? `&time_range=${JSON.stringify({since, until})}` : ''
    
    // Campos válidos na API de Insights do Facebook (apenas os suportados oficialmente)
    const fields = [
      // Identificação básica
      'campaign_id',
      'campaign_name',
      'adset_id',
      'adset_name',
      'ad_id',
      'ad_name',
      
      // Métricas básicas
      'impressions',
      'clicks',
      'spend',
      'reach',
      'frequency',
      
      // Métricas de custo
      'cpm',
      'cpc',
      'ctr',
      'cost_per_conversion',
      'cost_per_action_type',
      'cost_per_inline_link_click',
      'cost_per_unique_click',
      'cost_per_landing_page_view',
      
      // Métricas de engajamento (apenas as válidas)
      'inline_link_clicks',
      'inline_post_engagement',
      
      // Métricas de conversão
      'conversions',
      'conversion_values',
      'conversion_rate_ranking',
      
      // Métricas de vídeo (apenas as válidas na API de Insights)
      'video_play_actions',
      'video_play_curve_actions',
      
      // Métricas de qualidade
      'quality_ranking',
      'engagement_rate_ranking',
      
      // Métricas de ações (apenas as válidas)
      'actions',
      
      // Métricas de alcance e frequência (apenas as válidas)
      'unique_clicks',
      'unique_inline_link_clicks',
      'unique_ctr'
    ].join(',')
    
    return adIds.map(adId => ({
      method: 'GET',
      relative_url: `${adId}/insights?fields=${fields}&level=ad&date_preset=${datePreset}${timeRange}`
    }))
  }
}

export const facebookBatchAPI = new FacebookBatchAPI()
