import { 
  Eye, 
  MousePointer, 
  DollarSign, 
  Target, 
  Repeat, 
  TrendingUp, 
  Percent, 
  Link, 
  Heart, 
  Play, 
  ShoppingCart, 
  CheckCircle, 
  Users, 
  Globe, 
  Smartphone, 
  BarChart3,
  Zap,
  Star,
  Activity,
  Clock,
  Download,
  MessageSquare,
  ThumbsUp,
  Share2,
  Search,
  Filter,
  Award,
  TrendingDown,
  Minus,
  Plus
} from 'lucide-react'

export interface MetricConfig {
  id: string
  label: string
  description: string
  icon: any
  iconColor: string
  type: 'number' | 'currency' | 'percentage'
  visible: boolean
  order: number
  category: 'basic' | 'cost' | 'engagement' | 'conversion' | 'video' | 'quality' | 'actions' | 'landing' | 'reach' | 'frequency'
}

// Todas as métricas disponíveis na API do Meta
export const ALL_METRICS: MetricConfig[] = [
  // === MÉTRICAS BÁSICAS ===
  {
    id: 'impressions',
    label: 'Impressões',
    description: 'Número de vezes que seus anúncios foram exibidos',
    icon: Eye,
    iconColor: 'text-blue-600',
    type: 'number',
    visible: true,
    order: 1,
    category: 'basic'
  },
  {
    id: 'clicks',
    label: 'Cliques',
    description: 'Número de cliques em seus anúncios',
    icon: MousePointer,
    iconColor: 'text-green-600',
    type: 'number',
    visible: true,
    order: 2,
    category: 'basic'
  },
  {
    id: 'spend',
    label: 'Gasto',
    description: 'Valor total gasto em anúncios',
    icon: DollarSign,
    iconColor: 'text-red-600',
    type: 'currency',
    visible: true,
    order: 3,
    category: 'basic'
  },
  {
    id: 'reach',
    label: 'Alcance',
    description: 'Número de pessoas únicas que viram seus anúncios',
    icon: Target,
    iconColor: 'text-purple-600',
    type: 'number',
    visible: true,
    order: 4,
    category: 'basic'
  },
  {
    id: 'frequency',
    label: 'Frequência',
    description: 'Média de vezes que cada pessoa viu seu anúncio',
    icon: Repeat,
    iconColor: 'text-orange-600',
    type: 'number',
    visible: false,
    order: 5,
    category: 'basic'
  },

  // === MÉTRICAS DE CUSTO ===
  {
    id: 'cpm',
    label: 'CPM',
    description: 'Custo por mil impressões',
    icon: TrendingUp,
    iconColor: 'text-indigo-600',
    type: 'currency',
    visible: false,
    order: 6,
    category: 'cost'
  },
  {
    id: 'cpc',
    label: 'CPC',
    description: 'Custo por clique',
    icon: MousePointer,
    iconColor: 'text-teal-600',
    type: 'currency',
    visible: false,
    order: 7,
    category: 'cost'
  },
  {
    id: 'ctr',
    label: 'CTR',
    description: 'Taxa de clique (cliques / impressões)',
    icon: Percent,
    iconColor: 'text-pink-600',
    type: 'percentage',
    visible: false,
    order: 8,
    category: 'cost'
  },
  {
    id: 'cost_per_conversion',
    label: 'Custo por Conversão',
    description: 'Custo médio por conversão',
    icon: DollarSign,
    iconColor: 'text-amber-600',
    type: 'currency',
    visible: false,
    order: 9,
    category: 'cost'
  },
  {
    id: 'cost_per_action_type',
    label: 'Custo por Ação',
    description: 'Custo por tipo de ação específica',
    icon: DollarSign,
    iconColor: 'text-amber-700',
    type: 'currency',
    visible: false,
    order: 10,
    category: 'cost'
  },
  {
    id: 'cost_per_inline_link_click',
    label: 'Custo por Clique em Link',
    description: 'Custo por clique em link inline',
    icon: DollarSign,
    iconColor: 'text-amber-800',
    type: 'currency',
    visible: false,
    order: 11,
    category: 'cost'
  },
  {
    id: 'cost_per_unique_click',
    label: 'Custo por Clique Único',
    description: 'Custo por clique único',
    icon: DollarSign,
    iconColor: 'text-amber-900',
    type: 'currency',
    visible: false,
    order: 12,
    category: 'cost'
  },
  {
    id: 'cost_per_landing_page_view',
    label: 'Custo por Visualização de Página',
    description: 'Custo por visualização da página de destino',
    icon: DollarSign,
    iconColor: 'text-amber-950',
    type: 'currency',
    visible: false,
    order: 13,
    category: 'cost'
  },

  // === MÉTRICAS DE ENGAJAMENTO ===
  {
    id: 'inline_link_clicks',
    label: 'Cliques em Links',
    description: 'Número de cliques em links específicos',
    icon: Link,
    iconColor: 'text-cyan-600',
    type: 'number',
    visible: false,
    order: 14,
    category: 'engagement'
  },
  {
    id: 'inline_post_engagement',
    label: 'Engajamento',
    description: 'Interações com o post (likes, comentários, shares)',
    icon: Heart,
    iconColor: 'text-rose-600',
    type: 'number',
    visible: false,
    order: 15,
    category: 'engagement'
  },
  {
    id: 'post_engagement',
    label: 'Engajamento do Post',
    description: 'Total de engajamentos no post',
    icon: Heart,
    iconColor: 'text-rose-700',
    type: 'number',
    visible: false,
    order: 16,
    category: 'engagement'
  },
  {
    id: 'page_engagement',
    label: 'Engajamento da Página',
    description: 'Engajamentos na página do Facebook',
    icon: Users,
    iconColor: 'text-rose-800',
    type: 'number',
    visible: false,
    order: 17,
    category: 'engagement'
  },
  {
    id: 'post_reactions',
    label: 'Reações',
    description: 'Número de reações (likes, loves, etc.)',
    icon: ThumbsUp,
    iconColor: 'text-rose-900',
    type: 'number',
    visible: false,
    order: 18,
    category: 'engagement'
  },
  {
    id: 'post_comments',
    label: 'Comentários',
    description: 'Número de comentários no post',
    icon: MessageSquare,
    iconColor: 'text-rose-950',
    type: 'number',
    visible: false,
    order: 19,
    category: 'engagement'
  },
  {
    id: 'post_shares',
    label: 'Compartilhamentos',
    description: 'Número de compartilhamentos do post',
    icon: Share2,
    iconColor: 'text-rose-1000',
    type: 'number',
    visible: false,
    order: 20,
    category: 'engagement'
  },

  // === MÉTRICAS DE CONVERSÃO ===
  {
    id: 'conversions',
    label: 'Conversões',
    description: 'Número de conversões realizadas',
    icon: Target,
    iconColor: 'text-emerald-600',
    type: 'number',
    visible: false,
    order: 21,
    category: 'conversion'
  },
  {
    id: 'conversion_rate',
    label: 'Taxa de Conversão',
    description: 'Percentual de conversões em relação aos cliques',
    icon: Percent,
    iconColor: 'text-emerald-700',
    type: 'percentage',
    visible: false,
    order: 22,
    category: 'conversion'
  },
  {
    id: 'conversion_values',
    label: 'Valor das Conversões',
    description: 'Valor total das conversões',
    icon: DollarSign,
    iconColor: 'text-emerald-800',
    type: 'currency',
    visible: false,
    order: 23,
    category: 'conversion'
  },
  {
    id: 'conversion_rate_ranking',
    label: 'Ranking de Taxa de Conversão',
    description: 'Ranking de taxa de conversão vs concorrentes',
    icon: Award,
    iconColor: 'text-emerald-900',
    type: 'number',
    visible: false,
    order: 24,
    category: 'conversion'
  },

  // === MÉTRICAS DE VÍDEO ===
  {
    id: 'video_views',
    label: 'Visualizações de Vídeo',
    description: 'Número de visualizações de vídeo',
    icon: Play,
    iconColor: 'text-purple-600',
    type: 'number',
    visible: false,
    order: 25,
    category: 'video'
  },
  {
    id: 'video_views_3s',
    label: 'Visualizações 3s',
    description: 'Visualizações de vídeo por 3 segundos',
    icon: Play,
    iconColor: 'text-purple-700',
    type: 'number',
    visible: false,
    order: 26,
    category: 'video'
  },
  {
    id: 'video_views_25',
    label: 'Visualizações 25%',
    description: 'Visualizações de 25% do vídeo',
    icon: Play,
    iconColor: 'text-purple-800',
    type: 'number',
    visible: false,
    order: 27,
    category: 'video'
  },
  {
    id: 'video_views_50',
    label: 'Visualizações 50%',
    description: 'Visualizações de 50% do vídeo',
    icon: Play,
    iconColor: 'text-purple-900',
    type: 'number',
    visible: false,
    order: 28,
    category: 'video'
  },
  {
    id: 'video_views_75',
    label: 'Visualizações 75%',
    description: 'Visualizações de 75% do vídeo',
    icon: Play,
    iconColor: 'text-purple-950',
    type: 'number',
    visible: false,
    order: 29,
    category: 'video'
  },
  {
    id: 'video_views_100',
    label: 'Visualizações 100%',
    description: 'Visualizações de 100% do vídeo',
    icon: Play,
    iconColor: 'text-purple-1000',
    type: 'number',
    visible: false,
    order: 30,
    category: 'video'
  },
  {
    id: 'video_play_actions',
    label: 'Ações de Reprodução',
    description: 'Ações de reprodução do vídeo',
    icon: Play,
    iconColor: 'text-purple-1100',
    type: 'number',
    visible: false,
    order: 31,
    category: 'video'
  },
  {
    id: 'video_play_curve_actions',
    label: 'Curva de Reprodução',
    description: 'Ações na curva de reprodução do vídeo',
    icon: Activity,
    iconColor: 'text-purple-1200',
    type: 'number',
    visible: false,
    order: 32,
    category: 'video'
  },

  // === MÉTRICAS DE QUALIDADE ===
  {
    id: 'quality_ranking',
    label: 'Ranking de Qualidade',
    description: 'Ranking de qualidade vs concorrentes',
    icon: Award,
    iconColor: 'text-yellow-600',
    type: 'number',
    visible: false,
    order: 33,
    category: 'quality'
  },
  {
    id: 'engagement_rate_ranking',
    label: 'Ranking de Engajamento',
    description: 'Ranking de taxa de engajamento vs concorrentes',
    icon: Award,
    iconColor: 'text-yellow-700',
    type: 'number',
    visible: false,
    order: 34,
    category: 'quality'
  },
  {
    id: 'quality_score',
    label: 'Pontuação de Qualidade',
    description: 'Pontuação de qualidade do anúncio',
    icon: Star,
    iconColor: 'text-yellow-800',
    type: 'number',
    visible: false,
    order: 35,
    category: 'quality'
  },

  // === MÉTRICAS DE AÇÕES ===
  {
    id: 'actions',
    label: 'Ações',
    description: 'Total de ações realizadas',
    icon: Zap,
    iconColor: 'text-orange-600',
    type: 'number',
    visible: false,
    order: 36,
    category: 'actions'
  },
  {
    id: 'purchase',
    label: 'Compras',
    description: 'Número de compras realizadas',
    icon: ShoppingCart,
    iconColor: 'text-green-700',
    type: 'number',
    visible: false,
    order: 37,
    category: 'actions'
  },
  {
    id: 'add_to_cart',
    label: 'Adicionar ao Carrinho',
    description: 'Número de adições ao carrinho',
    icon: ShoppingCart,
    iconColor: 'text-green-800',
    type: 'number',
    visible: false,
    order: 38,
    category: 'actions'
  },
  {
    id: 'initiate_checkout',
    label: 'Iniciar Checkout',
    description: 'Número de inícios de checkout',
    icon: CheckCircle,
    iconColor: 'text-green-900',
    type: 'number',
    visible: false,
    order: 39,
    category: 'actions'
  },
  {
    id: 'lead',
    label: 'Leads',
    description: 'Número de leads gerados',
    icon: Users,
    iconColor: 'text-blue-700',
    type: 'number',
    visible: false,
    order: 40,
    category: 'actions'
  },
  {
    id: 'app_install',
    label: 'Instalações de App',
    description: 'Número de instalações de aplicativo',
    icon: Download,
    iconColor: 'text-blue-800',
    type: 'number',
    visible: false,
    order: 41,
    category: 'actions'
  },
  {
    id: 'app_events',
    label: 'Eventos de App',
    description: 'Número de eventos de aplicativo',
    icon: Smartphone,
    iconColor: 'text-blue-900',
    type: 'number',
    visible: false,
    order: 42,
    category: 'actions'
  },

  // === MÉTRICAS DE LANDING PAGE ===
  {
    id: 'landing_page_views',
    label: 'Visualizações de Página',
    description: 'Visualizações da página de destino',
    icon: Globe,
    iconColor: 'text-indigo-700',
    type: 'number',
    visible: false,
    order: 43,
    category: 'landing'
  },
  {
    id: 'landing_page_views_ctr',
    label: 'CTR da Página',
    description: 'Taxa de clique para a página de destino',
    icon: Percent,
    iconColor: 'text-indigo-800',
    type: 'percentage',
    visible: false,
    order: 44,
    category: 'landing'
  },

  // === MÉTRICAS DE ALCANCE E FREQUÊNCIA ===
  {
    id: 'unique_clicks',
    label: 'Cliques Únicos',
    description: 'Número de pessoas únicas que clicaram',
    icon: MousePointer,
    iconColor: 'text-teal-700',
    type: 'number',
    visible: false,
    order: 45,
    category: 'reach'
  },
  {
    id: 'unique_link_clicks',
    label: 'Cliques Únicos em Links',
    description: 'Número de pessoas únicas que clicaram em links',
    icon: Link,
    iconColor: 'text-teal-800',
    type: 'number',
    visible: false,
    order: 46,
    category: 'reach'
  },
  {
    id: 'unique_inline_link_clicks',
    label: 'Cliques Únicos Inline',
    description: 'Número de pessoas únicas que clicaram em links inline',
    icon: Link,
    iconColor: 'text-teal-900',
    type: 'number',
    visible: false,
    order: 47,
    category: 'reach'
  },
  {
    id: 'unique_ctr',
    label: 'CTR Único',
    description: 'Taxa de clique única (cliques únicos / alcance)',
    icon: Percent,
    iconColor: 'text-teal-950',
    type: 'percentage',
    visible: false,
    order: 48,
    category: 'reach'
  },

  // === MÉTRICAS DE FREQUÊNCIA ===
  {
    id: 'frequency_distribution',
    label: 'Distribuição de Frequência',
    description: 'Distribuição de frequência de visualização',
    icon: BarChart3,
    iconColor: 'text-violet-600',
    type: 'number',
    visible: false,
    order: 49,
    category: 'frequency'
  },
  {
    id: 'effective_frequency',
    label: 'Frequência Efetiva',
    description: 'Frequência efetiva de visualização',
    icon: Repeat,
    iconColor: 'text-violet-700',
    type: 'number',
    visible: false,
    order: 50,
    category: 'frequency'
  }
]

// Métricas organizadas por categoria
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

// Métricas principais (visíveis por padrão)
export const MAIN_METRICS = ALL_METRICS.filter(m => m.visible)

// Função para obter métricas por objetivo de campanha
export const getMetricsForObjective = (objective: string): MetricConfig[] => {
  const baseMetrics = ALL_METRICS.filter(m => m.category === 'basic' || m.category === 'cost')
  
  switch (objective) {
    case 'VIDEO_VIEWS':
      return [...baseMetrics, ...METRICS_BY_CATEGORY.video]
    case 'CONVERSIONS':
      return [...baseMetrics, ...METRICS_BY_CATEGORY.conversion, ...METRICS_BY_CATEGORY.actions]
    case 'TRAFFIC':
      return [...baseMetrics, ...METRICS_BY_CATEGORY.landing, ...METRICS_BY_CATEGORY.engagement]
    case 'LEAD_GENERATION':
      return [...baseMetrics, ...METRICS_BY_CATEGORY.actions.filter(m => m.id === 'lead')]
    case 'REACH':
      return [...baseMetrics, ...METRICS_BY_CATEGORY.reach, ...METRICS_BY_CATEGORY.frequency]
    case 'BRAND_AWARENESS':
      return [...baseMetrics, ...METRICS_BY_CATEGORY.engagement, ...METRICS_BY_CATEGORY.quality]
    default:
      return baseMetrics
  }
}
