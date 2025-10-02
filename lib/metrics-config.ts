// Métricas nativas da Meta Insights API - apenas métricas oficialmente suportadas

export interface MetricConfig {
  id: string
  label: string
  description: string
  type: 'number' | 'currency' | 'percentage'
  visible: boolean
  order: number
  category: 'basic' | 'cost' | 'engagement' | 'video' | 'reach' | 'frequency'
}

// Métricas nativas da Meta Insights API organizadas por categoria
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
    label: 'Cliques (todos)',
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

  // === MÉTRICAS DE CUSTO ===
  {
    id: 'cpc',
    label: 'CPC (todos)',
    description: 'Custo por clique',
    type: 'currency',
    visible: true,
    order: 4,
    category: 'cost'
  },
  {
    id: 'ctr',
    label: 'CTR (todos)',
    description: 'Taxa de cliques',
    type: 'percentage',
    visible: true,
    order: 5,
    category: 'cost'
  },
  {
    id: 'cpm',
    label: 'CPM',
    description: 'Custo por mil impressões',
    type: 'currency',
    visible: true,
    order: 6,
    category: 'cost'
  },
  {
    id: 'cost_per_unique_inline_link_click',
    label: 'CPC (custo por clique no link)',
    description: 'Custo por clique único em link inline',
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
    order: 12,
    category: 'reach'
  },
  {
    id: 'frequency',
    label: 'Frequência',
    description: 'Número médio de vezes que cada pessoa viu o anúncio',
    type: 'number',
    visible: false,
    order: 13,
    category: 'frequency'
  },
  {
    id: 'unique_clicks',
    label: 'Cliques únicos (todos)',
    description: 'Número de cliques únicos',
    type: 'number',
    visible: false,
    order: 14,
    category: 'reach'
  },
  {
    id: 'unique_ctr',
    label: 'CTR único (todos)',
    description: 'Taxa de cliques única',
    type: 'percentage',
    visible: false,
    order: 15,
    category: 'reach'
  },

  // === MÉTRICAS DE ENGAJAMENTO ===
  {
    id: 'inline_link_clicks',
    label: 'Cliques no Link',
    description: 'Cliques em links dentro do anúncio',
    type: 'number',
    visible: false,
    order: 17,
    category: 'engagement'
  },
  {
    id: 'inline_link_click_ctr',
    label: 'CTR (taxa de cliques no link)',
    description: 'Taxa de cliques no links',
    type: 'percentage',
    visible: false,
    order: 18,
    category: 'engagement'
  },
  {
    id: 'inline_post_engagement',
    label: 'Engajamentos com o post',
    description: 'Engajamento com post',
    type: 'number',
    visible: false,
    order: 19,
    category: 'engagement'
  },
  {
    id: 'unique_inline_link_clicks',
    label: 'Cliques no link únicos',
    description: 'Cliques únicos em links inline',
    type: 'number',
    visible: false,
    order: 20,
    category: 'engagement'
  },
  {
    id: 'unique_inline_link_click_ctr',
    label: 'CTR único (taxa de cliques no link)',
    description: 'Taxa de cliques única no link',
    type: 'percentage',
    visible: false,
    order: 21,
    category: 'engagement'
  },

  // === MÉTRICAS DE VÍDEO ===
  {
    id: 'video_play_actions',
    label: 'Reproduções de Vídeo',
    description: 'Ações de reprodução de vídeo',
    type: 'number',
    visible: false,
    order: 23,
    category: 'video'
  },
  {
    id: 'video_p25_watched_actions',
    label: 'Visualizações 25%',
    description: 'Número de vezes que o vídeo foi reproduzido até 25% do seu comprimento',
    type: 'number',
    visible: false,
    order: 24,
    category: 'video'
  },
  {
    id: 'video_p50_watched_actions',
    label: 'Visualizações 50%',
    description: 'Número de vezes que o vídeo foi reproduzido até 50% do seu comprimento',
    type: 'number',
    visible: false,
    order: 25,
    category: 'video'
  },
  {
    id: 'video_p75_watched_actions',
    label: 'Visualizações 75%',
    description: 'Número de vezes que o vídeo foi reproduzido até 75% do seu comprimento',
    type: 'number',
    visible: false,
    order: 26,
    category: 'video'
  },
  {
    id: 'video_p100_watched_actions',
    label: 'Visualizações 100%',
    description: 'Número de vezes que o vídeo foi reproduzido até 100% do seu comprimento',
    type: 'number',
    visible: false,
    order: 27,
    category: 'video'
  }
]

// Métricas principais para o dashboard (as mais importantes)
export const MAIN_METRICS: MetricConfig[] = ALL_METRICS.filter(metric => metric.visible)

// Categorização das métricas para filtros
export const METRICS_BY_CATEGORY = {
  basic: ALL_METRICS.filter(m => m.category === 'basic'),
  cost: ALL_METRICS.filter(m => m.category === 'cost'),
  engagement: ALL_METRICS.filter(m => m.category === 'engagement'),
  video: ALL_METRICS.filter(m => m.category === 'video'),
  reach: ALL_METRICS.filter(m => m.category === 'reach'),
  frequency: ALL_METRICS.filter(m => m.category === 'frequency')
}

// Categorias organizadas por ordem de importância
export const CATEGORY_ORDER = [
  'basic',
  'cost',
  'reach',
  'frequency',
  'engagement',
  'video'
]

// Labels das categorias para exibição
export const CATEGORY_LABELS = {
  basic: 'Métricas Básicas',
  cost: 'Custo',
  reach: 'Alcance',
  frequency: 'Frequência',
  engagement: 'Engajamento',
  video: 'Vídeo'
}