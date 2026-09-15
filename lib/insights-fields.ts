// Mapeia os ids de métrica do seletor de colunas do painel (lib/metrics-config.ts) para os
// campos reais da Ads Insights API que cada um precisa. Usado pra pedir à Meta só os campos das
// colunas que o usuário deixou ativas, em vez de sempre pedir um conjunto fixo de ~40 campos —
// a própria documentação da Meta lista o número de campos/métricas pedidos como um fator que
// aumenta a "pontuação de complexidade" de uma consulta e a chance de bater no rate limit
// (https://developers.facebook.com/docs/graph-api/overview/rate-limiting/).
//
// É uma allowlist: o cliente manda só os IDS de métrica do seletor (ex.: "cpc", "reach"), nunca
// nomes de campo livres — um id desconhecido é simplesmente ignorado, então não dá pra injetar
// campos arbitrários na consulta através desse parâmetro.
export const OPTIONAL_METRIC_FIELD_DEPENDENCIES: Record<string, string[]> = {
  cpc: ['cpc'],
  ctr: ['ctr'],
  cpm: ['cpm'],
  cost_per_inline_link_click: ['cost_per_inline_link_click'],
  cost_per_conversion: ['cost_per_action_type'],
  cost_per_initiate_checkout: ['cost_per_action_type', 'actions'],
  initiate_checkout: ['actions'],
  conversions: ['conversions'],
  conversion_values: ['conversion_values', 'action_values'],
  results: ['results'],
  reach: ['reach'],
  frequency: ['frequency'],
  unique_clicks: ['unique_clicks'],
  inline_link_clicks: ['inline_link_clicks'],
  unique_ctr: ['unique_ctr'],
  inline_link_click_ctr: ['inline_link_click_ctr'],
  inline_post_engagement: ['inline_post_engagement'],
  unique_inline_link_clicks: ['unique_inline_link_clicks'],
  unique_inline_link_click_ctr: ['unique_inline_link_click_ctr'],
  video_play_actions: ['video_play_actions'],
  video_p25_watched_actions: ['video_p25_watched_actions'],
  video_p50_watched_actions: ['video_p50_watched_actions'],
  video_p75_watched_actions: ['video_p75_watched_actions'],
  video_p95_watched_actions: ['video_p95_watched_actions'],
  video_p100_watched_actions: ['video_p100_watched_actions']
  // impressions/clicks/spend não entram aqui de propósito: são sempre incluídos (ver
  // *_ALWAYS_FIELDS abaixo), já que os cards de resumo da tela (Gasto Total, Impressões,
  // Cliques) dependem deles independentemente de quais colunas estejam visíveis na tabela.
}

// Todos os campos "opcionais" conhecidos — usado quando o cliente não informa quais colunas
// estão ativas (chamada antiga, ou qualquer outro consumidor que não manda `metricIds`).
const ALL_OPTIONAL_FIELDS = Array.from(
  new Set(Object.values(OPTIONAL_METRIC_FIELD_DEPENDENCIES).flat())
)

// Campos sempre pedidos em campanhas/conjuntos/anúncios, independente da seleção de colunas:
// identificação (usada para relacionar campanha/adset/ad), métricas básicas que alimentam os
// cards de resumo, e dois campos de custo únicos que já eram processados incondicionalmente no
// código antes desta mudança (não fazem parte do seletor de colunas, então não têm como o
// usuário desativá-los).
export const CAMPAIGN_ALWAYS_FIELDS = [
  'campaign_id', 'campaign_name', 'adset_id', 'adset_name', 'ad_id', 'ad_name',
  'impressions', 'clicks', 'spend',
  'cost_per_unique_click', 'cost_per_unique_inline_link_click',
  // Sem toggle no seletor de colunas (ver Seção 7 do doc de referência do projeto) — sempre
  // pedidos para campanhas, único nível que de fato os processa.
  'quality_ranking', 'engagement_rate_ranking', 'conversion_rate_ranking'
]

export const ADSET_OR_AD_ALWAYS_FIELDS = [
  'campaign_id', 'campaign_name', 'adset_id', 'adset_name', 'ad_id', 'ad_name',
  'impressions', 'clicks', 'spend',
  'cost_per_unique_click', 'cost_per_unique_inline_link_click'
]

export function resolveOptionalInsightFields(metricIdsParam: string | null): string[] {
  if (!metricIdsParam) return ALL_OPTIONAL_FIELDS

  const requestedIds = metricIdsParam.split(',').map(id => id.trim()).filter(Boolean)
  if (requestedIds.length === 0) return ALL_OPTIONAL_FIELDS

  const fields = new Set<string>()
  for (const id of requestedIds) {
    const mapped = OPTIONAL_METRIC_FIELD_DEPENDENCIES[id]
    if (mapped) mapped.forEach(f => fields.add(f))
  }

  return Array.from(fields)
}
