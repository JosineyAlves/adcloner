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
    fixed: true
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

  // Métricas básicas
  {
    id: 'impressions',
    label: 'Impressões',
    category: 'Métricas Básicas',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: true,
    order: 7,
    fixed: true
  },
  {
    id: 'clicks',
    label: 'Cliques',
    category: 'Métricas Básicas',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: true,
    order: 8,
    fixed: true
  },
  {
    id: 'spend',
    label: 'Gasto',
    category: 'Métricas Básicas',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: true,
    order: 9,
    fixed: true
  },
  {
    id: 'reach',
    label: 'Alcance',
    category: 'Métricas Básicas',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: true,
    order: 10,
    fixed: true
  },
  {
    id: 'frequency',
    label: 'Frequência',
    category: 'Métricas Básicas',
    type: 'number',
    format: (value) => parseFloat(value || '0').toFixed(2),
    visible: true,
    order: 11,
    fixed: true
  },

  // Métricas de custo
  {
    id: 'cpm',
    label: 'CPM',
    category: 'Métricas de Custo',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: true,
    order: 12,
    fixed: true
  },
  {
    id: 'cpc',
    label: 'CPC',
    category: 'Métricas de Custo',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: true,
    order: 13,
    fixed: true
  },
  {
    id: 'ctr',
    label: 'CTR',
    category: 'Métricas de Custo',
    type: 'percentage',
    format: (value) => `${parseFloat(value || '0').toFixed(2)}%`,
    visible: true,
    order: 14,
    fixed: true
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
  },
  {
    id: 'conversion_rate_ranking',
    label: 'Ranking de Conversão',
    category: 'Qualidade',
    type: 'text',
    visible: false,
    order: 19
  },

  // Métricas de conversão
  {
    id: 'conversions',
    label: 'Conversões',
    category: 'Conversão',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 20
  },
  {
    id: 'cost_per_conversion',
    label: 'Custo por Conversão',
    category: 'Conversão',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: false,
    order: 21
  },
  {
    id: 'conversion_values',
    label: 'Valores de Conversão',
    category: 'Conversão',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: false,
    order: 22
  },

  // Métricas de vídeo
  {
    id: 'video_p25_watched_actions',
    label: 'Vídeo 25% Assistido',
    category: 'Vídeo',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 23
  },
  {
    id: 'video_p50_watched_actions',
    label: 'Vídeo 50% Assistido',
    category: 'Vídeo',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 24
  },
  {
    id: 'video_p75_watched_actions',
    label: 'Vídeo 75% Assistido',
    category: 'Vídeo',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 25
  },
  {
    id: 'video_p95_watched_actions',
    label: 'Vídeo 95% Assistido',
    category: 'Vídeo',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 26
  },
  {
    id: 'video_p100_watched_actions',
    label: 'Vídeo 100% Assistido',
    category: 'Vídeo',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 27
  },
  {
    id: 'video_play_actions',
    label: 'Reproduções de Vídeo',
    category: 'Vídeo',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 28
  },
  {
    id: 'video_play_curve_actions',
    label: 'Curva de Reprodução',
    category: 'Vídeo',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 29
  },

  // Métricas de aplicativo
  {
    id: 'mobile_app_installs',
    label: 'Instalações Mobile',
    category: 'Aplicativo',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 30
  },
  {
    id: 'mobile_app_install_rate',
    label: 'Taxa de Instalação Mobile',
    category: 'Aplicativo',
    type: 'percentage',
    format: (value) => `${parseFloat(value || '0').toFixed(2)}%`,
    visible: false,
    order: 31
  },

  // Métricas de lead
  {
    id: 'leads',
    label: 'Leads',
    category: 'Lead',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 32
  },
  {
    id: 'cost_per_lead',
    label: 'Custo por Lead',
    category: 'Lead',
    type: 'currency',
    format: (value) => `R$ ${parseFloat(value || '0').toFixed(2)}`,
    visible: false,
    order: 33
  },

  // Métricas de página
  {
    id: 'page_likes',
    label: 'Curtidas da Página',
    category: 'Página',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 34
  },
  {
    id: 'page_engagement',
    label: 'Engajamento da Página',
    category: 'Página',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 35
  },
  {
    id: 'page_impressions',
    label: 'Impressões da Página',
    category: 'Página',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 36
  },
  {
    id: 'page_posts_impressions',
    label: 'Impressões de Posts',
    category: 'Página',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 37
  },

  // Métricas de evento
  {
    id: 'onsite_conversion',
    label: 'Conversões no Site',
    category: 'Eventos',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 38
  },
  {
    id: 'purchase',
    label: 'Compras',
    category: 'Eventos',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 39
  },
  {
    id: 'add_to_cart',
    label: 'Adicionar ao Carrinho',
    category: 'Eventos',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 40
  },
  {
    id: 'initiated_checkout',
    label: 'Iniciar Checkout',
    category: 'Eventos',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 41
  },
  {
    id: 'complete_registration',
    label: 'Registros Completos',
    category: 'Eventos',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 42
  },
  {
    id: 'view_content',
    label: 'Visualizações de Conteúdo',
    category: 'Eventos',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 43
  },
  {
    id: 'search',
    label: 'Buscas',
    category: 'Eventos',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 44
  },
  {
    id: 'add_to_wishlist',
    label: 'Adicionar à Lista de Desejos',
    category: 'Eventos',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 45
  },
  {
    id: 'start_order',
    label: 'Iniciar Pedido',
    category: 'Eventos',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 46
  },
  {
    id: 'add_payment_info',
    label: 'Adicionar Informações de Pagamento',
    category: 'Eventos',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 47
  },
  {
    id: 'contact',
    label: 'Contatos',
    category: 'Eventos',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 48
  },
  {
    id: 'custom',
    label: 'Eventos Personalizados',
    category: 'Eventos',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 49
  },
  {
    id: 'donate',
    label: 'Doações',
    category: 'Eventos',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 50
  },
  {
    id: 'find_location',
    label: 'Encontrar Localização',
    category: 'Eventos',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 51
  },
  {
    id: 'schedule',
    label: 'Agendamentos',
    category: 'Eventos',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 52
  },
  {
    id: 'subscribe',
    label: 'Inscrições',
    category: 'Eventos',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 53
  },
  {
    id: 'tutorial_completion',
    label: 'Conclusão de Tutorial',
    category: 'Eventos',
    type: 'number',
    format: (value) => parseInt(value || '0').toLocaleString(),
    visible: false,
    order: 54
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