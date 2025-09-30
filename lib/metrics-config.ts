// Ícones removidos para simplificar a interface

export interface MetricConfig {
  id: string
  label: string
  description: string
  type: 'number' | 'currency' | 'percentage'
  visible: boolean
  order: number
  category: 'basic' | 'cost' | 'engagement' | 'conversion' | 'video' | 'quality' | 'actions' | 'landing' | 'reach' | 'frequency'
}

// Métricas organizadas por ordem de importância e uso
export const ALL_METRICS: MetricConfig[] = [
  // === MÉTRICAS PRINCIPAIS (Sempre visíveis) ===
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

  // === MÉTRICAS DE CUSTO (Importantes para análise) ===
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
    visible: true,
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
  {
    id: 'inline_post_engagement',
    label: 'Engajamento Inline',
    description: 'Engajamento com posts inline',
    type: 'number',
    visible: false,
    order: 13,
    category: 'engagement'
  },

  // === MÉTRICAS DE VÍDEO ===
  {
    id: 'video_play_actions',
    label: 'Reproduções de Vídeo',
    description: 'Ações de reprodução de vídeo',
    type: 'number',
    visible: false,
    order: 14,
    category: 'video'
  },
  {
    id: 'video_play_curve_actions',
    label: 'Curva de Reprodução',
    description: 'Ações da curva de reprodução',
    type: 'number',
    visible: false,
    order: 15,
    category: 'video'
  },
  {
    id: 'video_views',
    label: 'Reproduções de Vídeo',
    description: 'Total de reproduções de vídeo iniciadas',
    type: 'number',
    visible: false,
    order: 16,
    category: 'video'
  },
  {
    id: 'video_views_25',
    label: 'Reproduções 25%',
    description: 'Reproduções que chegaram a 25% do vídeo',
    type: 'number',
    visible: false,
    order: 17,
    category: 'video'
  },
  {
    id: 'video_views_50',
    label: 'Reproduções 50%',
    description: 'Reproduções que chegaram a 50% do vídeo',
    type: 'number',
    visible: false,
    order: 18,
    category: 'video'
  },
  {
    id: 'video_views_75',
    label: 'Reproduções 75%',
    description: 'Reproduções que chegaram a 75% do vídeo',
    type: 'number',
    visible: false,
    order: 19,
    category: 'video'
  },
  {
    id: 'video_views_95',
    label: 'Reproduções 95%',
    description: 'Reproduções que chegaram a 95% do vídeo',
    type: 'number',
    visible: false,
    order: 20,
    category: 'video'
  },
  {
    id: 'video_views_100',
    label: 'Reproduções 100%',
    description: 'Reproduções que chegaram ao final do vídeo',
    type: 'number',
    visible: false,
    order: 21,
    category: 'video'
  },

  // === KPIs DE VÍDEO CALCULADOS ===
  {
    id: 'holdRate',
    label: 'Hold Rate',
    description: 'Vídeos assistidos 75% / impressões (%)',
    type: 'percentage',
    visible: false,
    order: 22,
    category: 'video'
  },
  {
    id: 'bodyConversion',
    label: 'Conversão do Body',
    description: 'Compras / Vídeos assistidos 75% (%)',
    type: 'percentage',
    visible: false,
    order: 23,
    category: 'video'
  },
  {
    id: 'bodyRetention',
    label: 'Retenção do Body',
    description: 'Vídeos assistidos 75% / Vídeos iniciados (%)',
    type: 'percentage',
    visible: false,
    order: 24,
    category: 'video'
  },
  {
    id: 'ctaRate',
    label: 'CTA Rate',
    description: 'Cliques no Link / Vídeos assistidos 75% (%)',
    type: 'percentage',
    visible: false,
    order: 25,
    category: 'video'
  },
  {
    id: 'hookPlayRate',
    label: 'Play Rate do Hook',
    description: 'Vídeos iniciados / Impressões (%)',
    type: 'percentage',
    visible: false,
    order: 26,
    category: 'video'
  },

  // === MÉTRICAS DE QUALIDADE ===
  {
    id: 'quality_ranking',
    label: 'Ranking de Qualidade',
    description: 'Ranking da qualidade do anúncio',
    type: 'number',
    visible: false,
    order: 27,
    category: 'quality'
  },
  {
    id: 'engagement_rate_ranking',
    label: 'Ranking de Engajamento',
    description: 'Ranking da taxa de engajamento',
    type: 'number',
    visible: false,
    order: 28,
    category: 'quality'
  },
  {
    id: 'conversion_rate_ranking',
    label: 'Ranking de Taxa de Conversão',
    description: 'Ranking da taxa de conversão',
    type: 'number',
    visible: false,
    order: 29,
    category: 'quality'
  },

  // === MÉTRICAS AVANÇADAS DE CUSTO ===
  {
    id: 'cost_per_action_type',
    label: 'Custo por Tipo de Ação',
    description: 'Custo por tipo específico de ação',
    type: 'currency',
    visible: false,
    order: 30,
    category: 'cost'
  },
  {
    id: 'cost_per_inline_link_click',
    label: 'Custo por Clique em Link',
    description: 'Custo por clique em links inline',
    type: 'currency',
    visible: false,
    order: 31,
    category: 'cost'
  },
  {
    id: 'cost_per_unique_click',
    label: 'Custo por Clique Único',
    description: 'Custo por clique único',
    type: 'currency',
    visible: false,
    order: 32,
    category: 'cost'
  },
  {
    id: 'cost_per_landing_page_view',
    label: 'Custo por Visualização de Página',
    description: 'Custo por visualização da página de destino',
    type: 'currency',
    visible: false,
    order: 33,
    category: 'cost'
  },

  // === MÉTRICAS DE AÇÕES ===
  {
    id: 'actions',
    label: 'Ações',
    description: 'Número total de ações',
    type: 'number',
    visible: false,
    order: 34,
    category: 'actions'
  },

  // === MÉTRICAS DE ALCANCE AVANÇADAS ===
  {
    id: 'unique_clicks',
    label: 'Cliques Únicos',
    description: 'Número de cliques únicos',
    type: 'number',
    visible: false,
    order: 35,
    category: 'reach'
  },
  {
    id: 'unique_inline_link_clicks',
    label: 'Cliques Únicos Inline',
    description: 'Cliques únicos em links inline',
    type: 'number',
    visible: false,
    order: 36,
    category: 'reach'
  },
  {
    id: 'unique_ctr',
    label: 'CTR Único',
    description: 'Taxa de cliques única',
    type: 'percentage',
    visible: false,
    order: 37,
    category: 'reach'
  }
]

// Métricas principais para o dashboard (as mais importantes)
export const MAIN_METRICS: MetricConfig[] = ALL_METRICS.filter(metric => metric.visible)

// Categorização das métricas para filtros
export const METRICS_BY_CATEGORY = {
  basic: ALL_METRICS.filter(m => m.category === 'basic'),
  cost: ALL_METRICS.filter(m => m.category === 'cost'),
  engagement: ALL_METRICS.filter(m => m.category === 'engagement'),
  conversion: ALL_METRICS.filter(m => m.category === 'conversion'),
  video: ALL_METRICS.filter(m => m.category === 'video'),
  quality: ALL_METRICS.filter(m => m.category === 'quality'),
  actions: ALL_METRICS.filter(m => m.category === 'actions'),
  landing: ALL_METRICS.filter(m => m.category === 'landing'),
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
  'engagement',
  'video',
  'quality',
  'actions',
  'landing'
]

// Labels das categorias para exibição
export const CATEGORY_LABELS = {
  basic: 'Métricas Básicas',
  conversion: 'Conversão',
  cost: 'Custo',
  reach: 'Alcance',
  frequency: 'Frequência',
  engagement: 'Engajamento',
  video: 'Vídeo',
  quality: 'Qualidade',
  actions: 'Ações',
  landing: 'Landing Page'
}