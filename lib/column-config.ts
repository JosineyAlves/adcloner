export interface ColumnConfig {
  id: string
  label: string
  category: string
  type: 'number' | 'currency' | 'percentage' | 'text'
  format?: (value: any) => string
  visible: boolean
  order: number
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  // Identificação
  {
    id: 'campaign_name',
    label: 'Campanha',
    category: 'Identificação',
    type: 'text',
    visible: true,
    order: 1
  },
  {
    id: 'adset_name',
    label: 'Conjunto de Anúncios',
    category: 'Identificação',
    type: 'text',
    visible: true,
    order: 2
  },
  {
    id: 'ad_name',
    label: 'Anúncio',
    category: 'Identificação',
    type: 'text',
    visible: true,
    order: 3
  },

  // Métricas básicas
  {
    id: 'impressions',
    label: 'Impressões',
    category: 'Métricas Básicas',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: true,
    order: 4
  },
  {
    id: 'clicks',
    label: 'Cliques',
    category: 'Métricas Básicas',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: true,
    order: 5
  },
  {
    id: 'spend',
    label: 'Gasto',
    category: 'Métricas Básicas',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: true,
    order: 6
  },
  {
    id: 'reach',
    label: 'Alcance',
    category: 'Métricas Básicas',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: true,
    order: 7
  },
  {
    id: 'frequency',
    label: 'Frequência',
    category: 'Métricas Básicas',
    type: 'number',
    format: (value) => parseFloat(value || '0').toFixed(2),
    visible: true,
    order: 8
  },

  // Métricas de custo
  {
    id: 'cpm',
    label: 'CPM',
    category: 'Métricas de Custo',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: true,
    order: 9
  },
  {
    id: 'cpc',
    label: 'CPC',
    category: 'Métricas de Custo',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: true,
    order: 10
  },
  {
    id: 'ctr',
    label: 'CTR',
    category: 'Métricas de Custo',
    type: 'percentage',
    format: (value) => `${parseFloat(value || '0').toFixed(2)}%`,
    visible: true,
    order: 11
  },

  // Métricas de engajamento
  {
    id: 'inline_link_clicks',
    label: 'Cliques em Links',
    category: 'Engajamento',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 12
  },
  {
    id: 'inline_post_engagement',
    label: 'Engajamento do Post',
    category: 'Engajamento',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 13
  },

  // Métricas de conversão
  {
    id: 'conversions',
    label: 'Conversões',
    category: 'Conversão',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 14
  },
  {
    id: 'cost_per_conversion',
    label: 'Custo por Conversão',
    category: 'Conversão',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: false,
    order: 15
  },
  {
    id: 'conversion_values',
    label: 'Valores de Conversão',
    category: 'Conversão',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: false,
    order: 16
  },

  // Métricas de qualidade
  {
    id: 'quality_ranking',
    label: 'Ranking de Qualidade',
    category: 'Qualidade',
    type: 'text',
    visible: false,
    order: 17
  },
  {
    id: 'engagement_rate_ranking',
    label: 'Ranking de Engajamento',
    category: 'Qualidade',
    type: 'text',
    visible: false,
    order: 18
  }
]

export function getVisibleColumns(columns: ColumnConfig[]): ColumnConfig[] {
  return columns
    .filter(col => col.visible)
    .sort((a, b) => a.order - b.order)
}

export function formatColumnValue(value: any, column: ColumnConfig): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (column.format) {
    return column.format(value)
  }

  switch (column.type) {
    case 'currency':
      return `R$ ${parseFloat(value || '0').toFixed(2)}`
    case 'percentage':
      return `${parseFloat(value || '0').toFixed(2)}%`
    case 'number':
      return parseInt(value || '0').toLocaleString()
    default:
      return String(value)
  }
}

export function getCategories(columns: ColumnConfig[]): string[] {
  return Array.from(new Set(columns.map(col => col.category)))
} 