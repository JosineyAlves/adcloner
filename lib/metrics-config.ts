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
  Plus,
  Hash,
  Tag,
  ExternalLink,
  UserCheck,
  MousePointerClick,
  CreditCard,
  Building,
  Smile,
  MessageCircle,
  Share,
  PlayCircle,
  ShoppingBag,
  UserPlus
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

// Métricas válidas disponíveis na API do Meta (apenas as suportadas oficialmente)
export const ALL_METRICS: MetricConfig[] = [
  // === MÉTRICAS BÁSICAS ===
  {
    id: 'impressions',
    label: 'Impressões',
    description: 'Número de vezes que o anúncio foi exibido',
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
    description: 'Número de cliques no anúncio',
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
    description: 'Valor total gasto no anúncio',
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
    description: 'Número de pessoas únicas que viram o anúncio',
    icon: Users,
    iconColor: 'text-purple-600',
    type: 'number',
    visible: true,
    order: 4,
    category: 'basic'
  },
  {
    id: 'frequency',
    label: 'Frequência',
    description: 'Número médio de vezes que cada pessoa viu o anúncio',
    icon: Repeat,
    iconColor: 'text-orange-600',
    type: 'number',
    visible: true,
    order: 5,
    category: 'basic'
  },

  // === MÉTRICAS DE CUSTO ===
  {
    id: 'cpm',
    label: 'CPM',
    description: 'Custo por mil impressões',
    icon: TrendingUp,
    iconColor: 'text-red-500',
    type: 'currency',
    visible: true,
    order: 6,
    category: 'cost'
  },
  {
    id: 'cpc',
    label: 'CPC',
    description: 'Custo por clique',
    icon: Target,
    iconColor: 'text-blue-500',
    type: 'currency',
    visible: true,
    order: 7,
    category: 'cost'
  },
  {
    id: 'ctr',
    label: 'CTR',
    description: 'Taxa de cliques',
    icon: MousePointerClick,
    iconColor: 'text-green-500',
    type: 'percentage',
    visible: true,
    order: 8,
    category: 'cost'
  },
  {
    id: 'cost_per_conversion',
    label: 'Custo por Conversão',
    description: 'Custo médio por conversão',
    icon: CreditCard,
    iconColor: 'text-purple-500',
    type: 'currency',
    visible: true,
    order: 9,
    category: 'cost'
  },
  {
    id: 'cost_per_action_type',
    label: 'Custo por Tipo de Ação',
    description: 'Custo por tipo específico de ação',
    icon: Activity,
    iconColor: 'text-indigo-500',
    type: 'currency',
    visible: false,
    order: 10,
    category: 'cost'
  },
  {
    id: 'cost_per_inline_link_click',
    label: 'Custo por Clique em Link',
    description: 'Custo por clique em links inline',
    icon: ExternalLink,
    iconColor: 'text-teal-500',
    type: 'currency',
    visible: false,
    order: 11,
    category: 'cost'
  },
  {
    id: 'cost_per_unique_click',
    label: 'Custo por Clique Único',
    description: 'Custo por clique único',
    icon: UserCheck,
    iconColor: 'text-pink-500',
    type: 'currency',
    visible: false,
    order: 12,
    category: 'cost'
  },
  {
    id: 'cost_per_landing_page_view',
    label: 'Custo por Visualização de Página',
    description: 'Custo por visualização da página de destino',
    icon: Globe,
    iconColor: 'text-cyan-500',
    type: 'currency',
    visible: false,
    order: 13,
    category: 'cost'
  },

  // === MÉTRICAS DE ENGAJAMENTO (apenas as válidas) ===
  {
    id: 'inline_link_clicks',
    label: 'Cliques em Links Inline',
    description: 'Cliques em links dentro do anúncio',
    icon: Link,
    iconColor: 'text-blue-400',
    type: 'number',
    visible: false,
    order: 14,
    category: 'engagement'
  },
  {
    id: 'inline_post_engagement',
    label: 'Engajamento Inline',
    description: 'Engajamento com posts inline',
    icon: Heart,
    iconColor: 'text-red-400',
    type: 'number',
    visible: false,
    order: 15,
    category: 'engagement'
  },

  // === MÉTRICAS DE CONVERSÃO ===
  {
    id: 'conversions',
    label: 'Conversões',
    description: 'Número total de conversões',
    icon: Target,
    iconColor: 'text-green-600',
    type: 'number',
    visible: true,
    order: 16,
    category: 'conversion'
  },
  {
    id: 'conversion_values',
    label: 'Valor das Conversões',
    description: 'Valor total das conversões',
    icon: DollarSign,
    iconColor: 'text-green-500',
    type: 'currency',
    visible: true,
    order: 17,
    category: 'conversion'
  },
  {
    id: 'conversion_rate_ranking',
    label: 'Ranking de Taxa de Conversão',
    description: 'Ranking da taxa de conversão',
    icon: Award,
    iconColor: 'text-yellow-500',
    type: 'number',
    visible: false,
    order: 18,
    category: 'conversion'
  },

  // === MÉTRICAS DE VÍDEO (apenas as válidas na API de Insights) ===
  {
    id: 'video_play_actions',
    label: 'Ações de Reprodução',
    description: 'Ações de reprodução de vídeo',
    icon: Play,
    iconColor: 'text-purple-500',
    type: 'number',
    visible: false,
    order: 19,
    category: 'video'
  },
  {
    id: 'video_play_curve_actions',
    label: 'Curva de Reprodução',
    description: 'Ações da curva de reprodução',
    icon: TrendingUp,
    iconColor: 'text-purple-400',
    type: 'number',
    visible: false,
    order: 20,
    category: 'video'
  },

  // === MÉTRICAS DE QUALIDADE ===
  {
    id: 'quality_ranking',
    label: 'Ranking de Qualidade',
    description: 'Ranking da qualidade do anúncio',
    icon: Star,
    iconColor: 'text-yellow-500',
    type: 'number',
    visible: false,
    order: 21,
    category: 'quality'
  },
  {
    id: 'engagement_rate_ranking',
    label: 'Ranking de Engajamento',
    description: 'Ranking da taxa de engajamento',
    icon: TrendingUp,
    iconColor: 'text-green-500',
    type: 'number',
    visible: false,
    order: 22,
    category: 'quality'
  },

  // === MÉTRICAS DE AÇÕES (apenas as válidas) ===
  {
    id: 'actions',
    label: 'Ações',
    description: 'Número total de ações',
    icon: Activity,
    iconColor: 'text-blue-500',
    type: 'number',
    visible: false,
    order: 23,
    category: 'actions'
  },

  // === MÉTRICAS DE ALCANCE E FREQUÊNCIA (apenas as válidas) ===
  {
    id: 'unique_clicks',
    label: 'Cliques Únicos',
    description: 'Número de cliques únicos',
    icon: UserCheck,
    iconColor: 'text-pink-500',
    type: 'number',
    visible: false,
    order: 24,
    category: 'reach'
  },
  {
    id: 'unique_inline_link_clicks',
    label: 'Cliques Únicos Inline',
    description: 'Cliques únicos em links inline',
    icon: Link,
    iconColor: 'text-blue-400',
    type: 'number',
    visible: false,
    order: 25,
    category: 'reach'
  },
  {
    id: 'unique_ctr',
    label: 'CTR Único',
    description: 'Taxa de cliques única',
    icon: MousePointerClick,
    iconColor: 'text-green-400',
    type: 'percentage',
    visible: false,
    order: 26,
    category: 'reach'
  }
]

// Métricas principais para o dashboard
export const MAIN_METRICS: MetricConfig[] = ALL_METRICS.filter(metric => metric.visible)

// Categorização das métricas
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