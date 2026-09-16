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
   * Monta o parâmetro de período pra uma chamada à Graph API — `date_preset` e `time_range` são
   * MUTUAMENTE EXCLUSIVOS na Marketing API (ver developers.facebook.com/docs/marketing-api/insights/parameters),
   * então nunca devem ser enviados juntos na mesma URL. Antes disso todas as chamadas deste
   * arquivo enviavam os dois ao mesmo tempo quando um período personalizado estava selecionado
   * (`date_preset=custom&time_range={...}` — "custom" nem é um valor válido de `date_preset`),
   * o que fazia o modo "Personalizado" da tela não se comportar de forma confiável.
   */
  private buildDateQueryParam(datePreset: string, since?: string, until?: string): string {
    if (since && until) {
      return `&time_range=${JSON.stringify({ since, until })}`
    }
    return `&date_preset=${datePreset}`
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
    const dateParam = this.buildDateQueryParam(datePreset, since, until)

    return [
      {
        method: 'GET',
        relative_url: `${accountId}/campaigns?fields=id,name,objective,status,effective_status,daily_budget,lifetime_budget,created_time,updated_time&limit=2500${dateParam}`
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
    const dateParam = this.buildDateQueryParam(datePreset, since, until)

    const fields = [
      ...CAMPAIGN_ALWAYS_FIELDS,
      ...resolveOptionalInsightFields(metricIdsParam ?? null)
    ].join(',')

    return campaignIds.map(campaignId => ({
      method: 'GET',
      relative_url: `${campaignId}/insights?fields=${fields}&level=campaign${dateParam}`
    }))
  }

  /**
   * Cria batch de requisições para insights de contas (level=account)
   */
  createAccountInsightsBatch(accountId: string, datePreset: string, since?: string, until?: string): BatchRequest[] {
    const dateParam = this.buildDateQueryParam(datePreset, since, until)

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
      'purchase_roas',
      
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
    
    return [
      {
        method: 'GET',
        relative_url: `${accountId}/insights?fields=${fields}&level=account${dateParam}`
      },
      // Segundo item do mesmo batch (mesma requisição HTTP, sem chamada extra de rede): busca
      // `account_status` direto no objeto Ad Account — esse campo NÃO existe na Ads Insights API
      // (level=account só tem métricas de performance), é exclusivo do objeto Ad Account em si.
      // É o que permite mostrar "Ativa"/"Restrita" na coluna Status da aba Contas.
      {
        method: 'GET',
        relative_url: `${accountId}?fields=account_status`
      }
    ]
  }

  /**
   * Cria batch de requisições para insights de conta segmentados por dimensão (breakdown) —
   * usado pelas visualizações "Vendas por País/Hora/Dia da Semana" do Dashboard. Tudo num único
   * batch (3 sub-requisições, 1 chamada HTTP só) pra não multiplicar o consumo de rate limit:
   * [0] breakdowns=country, [1] breakdowns=hourly_stats_aggregated_by_advertiser_time_zone,
   * [2] time_increment=1 sem breakdown (granularidade diária, usada para agregar por dia da
   * semana no backend). O parâmetro `breakdowns` da Insights API segmenta TODOS os campos
   * pedidos na mesma requisição — incluindo actions/action_values/conversions/conversion_values —
   * então "Vendas por País" reflete o país atribuído à conversão em si, não só a localização de
   * quem viu o anúncio.
   */
  createAccountInsightsBreakdownBatch(accountId: string, datePreset: string, since?: string, until?: string): BatchRequest[] {
    const dateParam = this.buildDateQueryParam(datePreset, since, until)

    const fields = [
      'spend',
      'impressions',
      'clicks',
      'actions',
      'action_values',
      'conversions',
      'conversion_values',
      'date_start',
      'date_stop'
    ].join(',')

    // Ordem fixa — o índice de cada item aqui é usado posicionalmente em
    // app/api/meta-business/insights-breakdown/route.ts (responses[0]=country, [1]=hora,
    // [2]=diário/dia da semana, [3]=plataforma, [4]=posicionamento, [5]=idade, [6]=dispositivo). `publisher_platform`
    // e `platform_position` são combináveis com `age` na mesma tabela de "Permutations" da doc
    // oficial da Meta, mas mantemos cada dimensão em sua própria sub-requisição (sem cruzar) pra
    // manter a leitura de cada gráfico simples — 6 sub-requisições, ainda 1 única chamada HTTP de
    // batch por conta.
    return [
      {
        method: 'GET',
        relative_url: `${accountId}/insights?fields=${fields}&level=account&limit=300&breakdowns=country${dateParam}`
      },
      {
        method: 'GET',
        relative_url: `${accountId}/insights?fields=${fields}&level=account&limit=300&breakdowns=hourly_stats_aggregated_by_advertiser_time_zone${dateParam}`
      },
      {
        method: 'GET',
        relative_url: `${accountId}/insights?fields=${fields}&level=account&limit=300&time_increment=1${dateParam}`
      },
      {
        method: 'GET',
        relative_url: `${accountId}/insights?fields=${fields}&level=account&limit=300&breakdowns=publisher_platform${dateParam}`
      },
      // platform_position sozinho não é uma combinação suportada pela Meta (não aparece na
      // tabela de "Permutations" da doc oficial) e retorna lista vazia — precisa vir combinado
      // com publisher_platform na mesma sub-requisição para a API realmente segmentar por
      // posicionamento. A rota (insights-breakdown) usa só o campo platform_position da linha,
      // mesclando os valores entre as plataformas.
      {
        method: 'GET',
        relative_url: `${accountId}/insights?fields=${fields}&level=account&limit=300&breakdowns=publisher_platform,platform_position${dateParam}`
      },
      {
        method: 'GET',
        relative_url: `${accountId}/insights?fields=${fields}&level=account&limit=300&breakdowns=age${dateParam}`
      },
      // device_platform (Mobile vs. Desktop) — diferente de platform_position/impression_device,
      // esse breakdown É suportado sozinho pela Meta (confirmado na doc oficial, marcado como
      // combinável apenas opcionalmente com action_type/action_target_id/action_destination, que
      // não usamos aqui).
      {
        method: 'GET',
        relative_url: `${accountId}/insights?fields=${fields}&level=account&limit=300&breakdowns=device_platform${dateParam}`
      }
    ]
  }

  /**
   * Cria batch de requisições para ad sets
   */
  createAdSetsBatch(accountId: string, datePreset: string, since?: string, until?: string, campaignIds?: string[]): BatchRequest[] {
    const dateParam = this.buildDateQueryParam(datePreset, since, until)
    // Quando o usuário já selecionou campanha(s) específica(s) na aba Campanhas, filtra os ad
    // sets direto na Graph API (`filtering` por campaign.id) em vez de trazer TODOS os ad sets
    // da conta (podem ser milhares) e descartar a maioria no cliente. Além de mais rápido, isso
    // evita gastar rate limit buscando insights (chamada individual por ad set, ver
    // createAdSetInsightsBatch) de ad sets que nem seriam exibidos.
    const filteringParam = campaignIds && campaignIds.length > 0
      ? `&filtering=${JSON.stringify([{ field: 'campaign.id', operator: 'IN', value: campaignIds }])}`
      : ''

    return [
      {
        method: 'GET',
        // campaign{...,daily_budget,lifetime_budget} pede os campos de orçamento da campanha-pai
        // via field expansion (mesma chamada, sem custo extra de rate limit) — é o único jeito de
        // saber se aquela campanha usa CBO (Advantage Campaign Budget): a Graph API não expõe um
        // booleano dedicado para isso, só o fato de o orçamento estar setado na Campaign em vez do
        // Ad Set. Ver `campaignAdvantageBudget` em app/api/meta-business/adsets/route.ts.
        relative_url: `${accountId}/adsets?fields=id,name,campaign_id,campaign{id,name,daily_budget,lifetime_budget},status,effective_status,daily_budget,lifetime_budget,created_time,updated_time&limit=2500${dateParam}${filteringParam}`
      }
    ]
  }

  /**
   * Cria batch de requisições para insights de ad sets.
   * `metricIdsParam`: ver comentário em createCampaignInsightsBatch.
   */
  createAdSetInsightsBatch(adSetIds: string[], datePreset: string, since?: string, until?: string, metricIdsParam?: string | null): BatchRequest[] {
    const dateParam = this.buildDateQueryParam(datePreset, since, until)

    const fields = [
      ...ADSET_OR_AD_ALWAYS_FIELDS,
      ...resolveOptionalInsightFields(metricIdsParam ?? null)
    ].join(',')

    return adSetIds.map(adSetId => ({
      method: 'GET',
      relative_url: `${adSetId}/insights?fields=${fields}&level=adset${dateParam}`
    }))
  }

  /**
   * Cria batch de requisições para ads
   */
  createAdsBatch(accountId: string, datePreset: string, since?: string, until?: string, adSetIds?: string[], campaignIds?: string[]): BatchRequest[] {
    const dateParam = this.buildDateQueryParam(datePreset, since, until)
    // Mesma lógica de createAdSetsBatch: se o usuário já selecionou conjunto(s) (o mais
    // específico) ou campanha(s) na tela, filtra os anúncios direto na Graph API em vez de
    // trazer todos os anúncios da conta. adset.id tem prioridade sobre campaign.id porque uma
    // seleção de conjunto é sempre mais específica que a de campanha.
    const filteringField = adSetIds && adSetIds.length > 0
      ? { field: 'adset.id', operator: 'IN', value: adSetIds }
      : campaignIds && campaignIds.length > 0
        ? { field: 'campaign.id', operator: 'IN', value: campaignIds }
        : null
    const filteringParam = filteringField
      ? `&filtering=${JSON.stringify([filteringField])}`
      : ''

    return [
      {
        method: 'GET',
        relative_url: `${accountId}/ads?fields=id,name,adset_id,adset{id,name},campaign_id,campaign{id,name},status,effective_status,created_time,updated_time&limit=2500${dateParam}${filteringParam}`
      }
    ]
  }

  /**
   * Cria batch de requisições para insights de ads.
   * `metricIdsParam`: ver comentário em createCampaignInsightsBatch.
   */
  createAdInsightsBatch(adIds: string[], datePreset: string, since?: string, until?: string, metricIdsParam?: string | null): BatchRequest[] {
    const dateParam = this.buildDateQueryParam(datePreset, since, until)

    const fields = [
      ...ADSET_OR_AD_ALWAYS_FIELDS,
      ...resolveOptionalInsightFields(metricIdsParam ?? null)
    ].join(',')

    return adIds.map(adId => ({
      method: 'GET',
      relative_url: `${adId}/insights?fields=${fields}&level=ad${dateParam}`
    }))
  }
}

export const facebookBatchAPI = new FacebookBatchAPI()