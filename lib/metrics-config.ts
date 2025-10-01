// Configuração de métricas baseada apenas nas métricas nativas da Meta Insights API
// Removidas métricas calculadas e não nativas

export interface MetricConfig {
  id: string
  label: string
  description: string
  type: 'number' | 'currency' | 'percentage'
  visible: boolean
  order: number
  category: 'basic' | 'cost' | 'engagement' | 'conversion' | 'reach' | 'frequency'
}

// Métricas nativas da Meta Insights API organizadas por ordem de importância
export const ALL_METRICS: MetricConfig[] = [
  // === MÉTRICAS BÁSICAS (Sempre visíveis) ===
  {
    id: 'impressions',
    label: 'Impressões',
    description: 'Número de vezes que o anúncio foi exibido',
    type: 'number',
    visible: true,
    order: 1,
    category: 'basic'
  },
  {
    id: 'clicks',
    label: 'Cliques',
    description: 'Número de cliques no anúncio',
    type: 'number',
    visible: true,
    order: 2,
    category: 'basic'
  },
  {
    id: 'spend',
    label: 'Gasto',
    description: 'Valor total gasto no anúncio',
    type: 'currency',
    visible: true,
    order: 3,
    category: 'basic'
  },

  // === MÉTRICAS DE CONVERSÃO ===
  {
    id: 'conversions',
    label: 'Conversões',
    description: 'Número total de conversões',
    type: 'number',
    visible: true,
    order: 4,
    category: 'conversion'
  },
  {
    id: 'conversion_values',
    label: 'Valor das Conversões',
    description: 'Valor total das conversões',
    type: 'currency',
    visible: true,
    order: 5,
    category: 'conversion'
  },

  // === MÉTRICAS DE CUSTO ===
  {
    id: 'cpc',
    label: 'CPC',
    description: 'Custo por clique',
    type: 'currency',
    visible: true,
    order: 6,
    category: 'cost'
  },
  {
    id: 'ctr',
    label: 'CTR',
    description: 'Taxa de cliques',
    type: 'percentage',
    visible: true,
    order: 7,
    category: 'cost'
  },
  {
    id: 'cpm',
    label: 'CPM',
    description: 'Custo por mil impressões',
    type: 'currency',
    visible: true,
    order: 8,
    category: 'cost'
  },
  {
    id: 'cost_per_conversion',
    label: 'Custo por Conversão',
    description: 'Custo médio por conversão',
    type: 'currency',
    visible: false,
    order: 9,
    category: 'cost'
  },

  // === MÉTRICAS DE ALCANCE E FREQUÊNCIA ===
  {
    id: 'reach',
    label: 'Alcance',
    description: 'Número de pessoas únicas que viram o anúncio',
    type: 'number',
    visible: false,
    order: 10,
    category: 'reach'
  },
  {
    id: 'frequency',
    label: 'Frequência',
    description: 'Número médio de vezes que cada pessoa viu o anúncio',
    type: 'number',
    visible: false,
    order: 11,
    category: 'frequency'
  },

  // === MÉTRICAS DE ENGAJAMENTO ===
  {
    id: 'inline_link_clicks',
    label: 'Cliques em Links',
    description: 'Cliques em links dentro do anúncio',
    type: 'number',
    visible: false,
    order: 12,
    category: 'engagement'
  },

  // === MÉTRICAS DE VÍDEO (REMOVIDAS - NÃO SUPORTADAS) ===

  // === MÉTRICAS DE QUALIDADE (REMOVIDAS - NÃO NATIVAS) ===

  // === MÉTRICAS DE CUSTO AVANÇADAS ===
  {
    id: 'cost_per_inline_link_click',
    label: 'Custo por Clique em Link',
    description: 'Custo por clique em links inline',
    type: 'currency',
    visible: false,
    order: 26,
    category: 'cost'
  },
  {
    id: 'cost_per_unique_click',
    label: 'Custo por Clique Único',
    description: 'Custo por clique único',
    type: 'currency',
    visible: false,
    order: 27,
    category: 'cost'
  },
  {
    id: 'cost_per_landing_page_view',
    label: 'Custo por Visualização de Página',
    description: 'Custo por visualização da página de destino',
    type: 'currency',
    visible: false,
    order: 28,
    category: 'cost'
  },

  // === MÉTRICAS DE AÇÕES (REMOVIDAS - NÃO RELEVANTES) ===

  // === MÉTRICAS DE ALCANCE AVANÇADAS ===
  {
    id: 'unique_clicks',
    label: 'Cliques Únicos',
    description: 'Número de cliques únicos',
    type: 'number',
    visible: false,
    order: 30,
    category: 'reach'
  },
  {
    id: 'unique_inline_link_clicks',
    label: 'Cliques Únicos Inline',
    description: 'Cliques únicos em links inline',
    type: 'number',
    visible: false,
    order: 31,
    category: 'reach'
  },
  {
    id: 'unique_ctr',
    label: 'CTR Único',
    description: 'Taxa de cliques única',
    type: 'percentage',
    visible: false,
    order: 32,
    category: 'reach'
  },

  // === MÉTRICAS DE LANDING PAGE (REMOVIDAS - NÃO NATIVAS) ===
]

// Métricas principais para o dashboard (as mais importantes)
export const MAIN_METRICS: MetricConfig[] = ALL_METRICS.filter(metric => metric.visible)

// Categorização das métricas para filtros
export const METRICS_BY_CATEGORY = {
  basic: ALL_METRICS.filter(m => m.category === 'basic'),
  cost: ALL_METRICS.filter(m => m.category === 'cost'),
  engagement: ALL_METRICS.filter(m => m.category === 'engagement'),
  conversion: ALL_METRICS.filter(m => m.category === 'conversion'),
  reach: ALL_METRICS.filter(m => m.category === 'reach'),
  frequency: ALL_METRICS.filter(m => m.category === 'frequency')
}

// Categorias organizadas por ordem de importância
export const CATEGORY_ORDER = [
  'basic',
  'conversion', 
  'cost',
  'reach',
  'frequency',
  'engagement'
]

// Labels das categorias para exibição
export const CATEGORY_LABELS = {
  basic: 'Métricas Básicas',
  conversion: 'Conversão',
  cost: 'Custo',
  reach: 'Alcance',
  frequency: 'Frequência',
  engagement: 'Engajamento'
}