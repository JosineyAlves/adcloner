import { ColumnConfig } from './column-config'

export const ALL_METRICS_CONFIG: ColumnConfig[] = [
  // Identificação
  {
    id: 'campaign_id',
    label: 'ID da Campanha',
    category: 'Identificação',
    type: 'text',
    visible: false,
    order: 1
  },
  {
    id: 'campaign_name',
    label: 'Campanha',
    category: 'Identificação',
    type: 'text',
    visible: true,
    order: 2,
    fixed: true // SEMPRE VISÍVEL
  },
  {
    id: 'adset_id',
    label: 'ID do Conjunto',
    category: 'Identificação',
    type: 'text',
    visible: false,
    order: 3
  },
  {
    id: 'adset_name',
    label: 'Conjunto de Anúncios',
    category: 'Identificação',
    type: 'text',
    visible: false,
    order: 4
  },
  {
    id: 'ad_id',
    label: 'ID do Anúncio',
    category: 'Identificação',
    type: 'text',
    visible: false,
    order: 5
  },
  {
    id: 'ad_name',
    label: 'Anúncio',
    category: 'Identificação',
    type: 'text',
    visible: false,
    order: 6
  },

  // Métricas básicas - SEMPRE VISÍVEIS
  {
    id: 'impressions',
    label: 'Impressões',
    category: 'Métricas Básicas',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: true,
    order: 7,
    fixed: true // SEMPRE VISÍVEL
  },
  {
    id: 'clicks',
    label: 'Cliques',
    category: 'Métricas Básicas',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: true,
    order: 8,
    fixed: true // SEMPRE VISÍVEL
  },
  {
    id: 'spend',
    label: 'Gasto',
    category: 'Métricas Básicas',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: true,
    order: 9,
    fixed: true // SEMPRE VISÍVEL
  },
  {
    id: 'reach',
    label: 'Alcance',
    category: 'Métricas Básicas',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: true,
    order: 10,
    fixed: true // SEMPRE VISÍVEL
  },
  {
    id: 'frequency',
    label: 'Frequência',
    category: 'Métricas Básicas',
    type: 'number',
    format: (value) => parseFloat(value || '0').toFixed(2),
    visible: true,
    order: 11,
    fixed: true // SEMPRE VISÍVEL
  },

  // Métricas de custo - SEMPRE VISÍVEIS
  {
    id: 'cpm',
    label: 'CPM',
    category: 'Métricas de Custo',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: true,
    order: 12,
    fixed: true // SEMPRE VISÍVEL
  },
  {
    id: 'cpc',
    label: 'CPC',
    category: 'Métricas de Custo',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: true,
    order: 13,
    fixed: true // SEMPRE VISÍVEL
  },
  {
    id: 'ctr',
    label: 'CTR',
    category: 'Métricas de Custo',
    type: 'percentage',
    format: (value) => `${parseFloat(value || '0').toFixed(2)}%`,
    visible: true,
    order: 14,
    fixed: true // SEMPRE VISÍVEL
  },

  // Métricas de engajamento
  {
    id: 'inline_link_clicks',
    label: 'Cliques em Links',
    category: 'Engajamento',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 15
  },
  {
    id: 'inline_post_engagement',
    label: 'Engajamento do Post',
    category: 'Engajamento',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 16
  },

  // Métricas de conversão
  {
    id: 'conversions',
    label: 'Conversões',
    category: 'Conversão',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 17
  },
  {
    id: 'cost_per_conversion',
    label: 'Custo por Conversão',
    category: 'Conversão',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: false,
    order: 18
  },
  {
    id: 'conversion_values',
    label: 'Valores de Conversão',
    category: 'Conversão',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: false,
    order: 19
  },

  // Métricas de qualidade
  {
    id: 'quality_ranking',
    label: 'Ranking de Qualidade',
    category: 'Qualidade',
    type: 'text',
    visible: false,
    order: 20
  },
  {
    id: 'engagement_rate_ranking',
    label: 'Ranking de Engajamento',
    category: 'Qualidade',
    type: 'text',
    visible: false,
    order: 21
  },
  {
    id: 'conversion_rate_ranking',
    label: 'Ranking de Conversão',
    category: 'Qualidade',
    type: 'text',
    visible: false,
    order: 22
  }
]

export function getMetricCategories(): string[] {
  return Array.from(new Set(ALL_METRICS_CONFIG.map(metric => metric.category)))
}

export function getMetricsByCategory(category: string): ColumnConfig[] {
  return ALL_METRICS_CONFIG.filter(metric => metric.category === category)
}

export function getFixedMetrics(): ColumnConfig[] {
  return ALL_METRICS_CONFIG.filter(metric => metric.fixed)
}

export function getSelectableMetrics(): ColumnConfig[] {
  return ALL_METRICS_CONFIG.filter(metric => !metric.fixed)
} 