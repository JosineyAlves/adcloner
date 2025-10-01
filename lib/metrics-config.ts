// Métricas nativas da Meta Insights API - apenas métricas oficialmente suportadas

export interface MetricConfig {
  id: string
  label: string
  description: string
  type: 'number' | 'currency' | 'percentage'
  visible: boolean
  order: number
  category: 'basic' | 'cost' | 'engagement' | 'video' | 'quality' | 'actions' | 'reach' | 'frequency'
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

  // === MÉTRICAS DE CUSTO ===
  {
    id: 'cpc',
    label: 'CPC',
    description: 'Custo por clique',
    type: 'currency',
    visible: true,
    order: 4,
    category: 'cost'
  },
  {
    id: 'ctr',
    label: 'CTR',
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
    id: 'cpp',
    label: 'CPP',
    description: 'Custo por mil pessoas alcançadas',
    type: 'currency',
    visible: false,
    order: 7,
    category: 'cost'
  },
  {
    id: 'cost_per_action_type',
    label: 'Custo por Tipo de Ação',
    description: 'Custo por tipo específico de ação',
    type: 'currency',
    visible: false,
    order: 8,
    category: 'cost'
  },
  {
    id: 'cost_per_unique_click',
    label: 'Custo por Clique Único',
    description: 'Custo por clique único',
    type: 'currency',
    visible: false,
    order: 9,
    category: 'cost'
  },
  {
    id: 'cost_per_unique_inline_link_click',
    label: 'Custo por Clique Único Inline',
    description: 'Custo por clique único em links inline',
    type: 'currency',
    visible: false,
    order: 10,
    category: 'cost'
  },
  {
    id: 'cost_per_unique_inline_post_engagement',
    label: 'Custo por Engajamento Único Inline',
    description: 'Custo por engajamento único em posts inline',
    type: 'currency',
    visible: false,
    order: 11,
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
    label: 'Cliques Únicos',
    description: 'Número de cliques únicos',
    type: 'number',
    visible: false,
    order: 14,
    category: 'reach'
  },
  {
    id: 'unique_ctr',
    label: 'CTR Único',
    description: 'Taxa de cliques única',
    type: 'percentage',
    visible: false,
    order: 15,
    category: 'reach'
  },
  {
    id: 'unique_impressions',
    label: 'Impressões Únicas',
    description: 'Número de impressões únicas',
    type: 'number',
    visible: false,
    order: 16,
    category: 'reach'
  },

  // === MÉTRICAS DE ENGAJAMENTO ===
  {
    id: 'inline_link_clicks',
    label: 'Cliques em Links Inline',
    description: 'Cliques em links dentro do anúncio',
    type: 'number',
    visible: false,
    order: 17,
    category: 'engagement'
  },
  {
    id: 'inline_link_click_ctr',
    label: 'CTR de Links Inline',
    description: 'Taxa de cliques em links inline',
    type: 'percentage',
    visible: false,
    order: 18,
    category: 'engagement'
  },
  {
    id: 'inline_post_engagement',
    label: 'Engajamento Inline',
    description: 'Engajamento com posts inline',
    type: 'number',
    visible: false,
    order: 19,
    category: 'engagement'
  },
  {
    id: 'unique_inline_link_clicks',
    label: 'Cliques Únicos Inline',
    description: 'Cliques únicos em links inline',
    type: 'number',
    visible: false,
    order: 20,
    category: 'engagement'
  },
  {
    id: 'unique_inline_link_click_ctr',
    label: 'CTR Único Inline',
    description: 'Taxa de cliques única em links inline',
    type: 'percentage',
    visible: false,
    order: 21,
    category: 'engagement'
  },
  {
    id: 'unique_inline_post_engagement',
    label: 'Engajamento Único Inline',
    description: 'Engajamento único com posts inline',
    type: 'number',
    visible: false,
    order: 22,
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
  },
  {
    id: 'video_thruplay_actions',
    label: 'Visualizações Completas',
    description: 'Número de vezes que o vídeo foi reproduzido até o final ou por pelo menos 15 segundos',
    type: 'number',
    visible: false,
    order: 28,
    category: 'video'
  },
  {
    id: 'video_watched_actions',
    label: 'Visualizações Assistidas',
    description: 'Número de vezes que o vídeo foi assistido',
    type: 'number',
    visible: false,
    order: 29,
    category: 'video'
  },
  {
    id: 'video_avg_percent_watched',
    label: 'Percentual Médio Assistido',
    description: 'Percentual médio do vídeo que foi assistido',
    type: 'percentage',
    visible: false,
    order: 30,
    category: 'video'
  },
  {
    id: 'video_avg_time_watched',
    label: 'Tempo Médio Assistido',
    description: 'Tempo médio que o vídeo foi assistido',
    type: 'number',
    visible: false,
    order: 31,
    category: 'video'
  },

  // === MÉTRICAS DE AÇÕES ===
  {
    id: 'actions',
    label: 'Ações',
    description: 'Número total de ações',
    type: 'number',
    visible: false,
    order: 32,
    category: 'actions'
  },
  {
    id: 'action_values',
    label: 'Valor das Ações',
    description: 'Valor total das ações',
    type: 'currency',
    visible: false,
    order: 33,
    category: 'actions'
  },
  {
    id: 'unique_actions',
    label: 'Ações Únicas',
    description: 'Número de ações únicas',
    type: 'number',
    visible: false,
    order: 34,
    category: 'actions'
  },

  // === MÉTRICAS DE QUALIDADE ===
  {
    id: 'quality_ranking',
    label: 'Ranking de Qualidade',
    description: 'Ranking da qualidade do anúncio',
    type: 'number',
    visible: false,
    order: 35,
    category: 'quality'
  },
  {
    id: 'engagement_rate_ranking',
    label: 'Ranking de Engajamento',
    description: 'Ranking da taxa de engajamento',
    type: 'number',
    visible: false,
    order: 36,
    category: 'quality'
  },

  // === MÉTRICAS SOCIAIS ===
  {
    id: 'social_clicks',
    label: 'Cliques Sociais',
    description: 'Número de cliques em anúncios do contexto social',
    type: 'number',
    visible: false,
    order: 37,
    category: 'engagement'
  },
  {
    id: 'social_impressions',
    label: 'Impressões Sociais',
    description: 'Número de impressões do contexto social',
    type: 'number',
    visible: false,
    order: 38,
    category: 'engagement'
  },
  {
    id: 'social_reach',
    label: 'Alcance Social',
    description: 'Número de pessoas que viram anúncios do contexto social',
    type: 'number',
    visible: false,
    order: 39,
    category: 'engagement'
  },
  {
    id: 'social_spend',
    label: 'Gasto Social',
    description: 'Valor gasto em anúncios do contexto social',
    type: 'currency',
    visible: false,
    order: 40,
    category: 'engagement'
  },

  // === MÉTRICAS DE DEEP LINK ===
  {
    id: 'deeplink_clicks',
    label: 'Cliques em Deep Link',
    description: 'Número de cliques no deep link',
    type: 'number',
    visible: false,
    order: 41,
    category: 'engagement'
  },

  // === MÉTRICAS DE APP STORE ===
  {
    id: 'app_store_clicks',
    label: 'Cliques na App Store',
    description: 'Número de cliques no link da app store',
    type: 'number',
    visible: false,
    order: 42,
    category: 'engagement'
  },

  // === MÉTRICAS DE CANVAS ===
  {
    id: 'canvas_avg_view_percent',
    label: 'Percentual Médio de Visualização do Canvas',
    description: 'Percentual médio de um anúncio Canvas visualizado',
    type: 'percentage',
    visible: false,
    order: 43,
    category: 'engagement'
  },
  {
    id: 'canvas_avg_view_time',
    label: 'Tempo Médio de Visualização do Canvas',
    description: 'Tempo médio gasto visualizando um anúncio Canvas',
    type: 'number',
    visible: false,
    order: 44,
    category: 'engagement'
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
  quality: ALL_METRICS.filter(m => m.category === 'quality'),
  actions: ALL_METRICS.filter(m => m.category === 'actions'),
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
  'video',
  'quality',
  'actions'
]

// Labels das categorias para exibição
export const CATEGORY_LABELS = {
  basic: 'Métricas Básicas',
  cost: 'Custo',
  reach: 'Alcance',
  frequency: 'Frequência',
  engagement: 'Engajamento',
  video: 'Vídeo',
  quality: 'Qualidade',
  actions: 'Ações'
}