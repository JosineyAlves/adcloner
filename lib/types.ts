export interface FacebookAccount {
  id: string
  name: string
  businessManagerId: string
  businessManagerName: string
  status: 'active' | 'disabled' | 'pending'
  tokenStatus: 'valid' | 'expired' | 'invalid'
  pages: FacebookPage[]
  pixels: FacebookPixel[]
  // Informações do perfil do Facebook
  profileName?: string
  profileEmail?: string
  profileId?: string
  createdAt: string
  updatedAt: string
}

export interface FacebookPage {
  id: string
  name: string
  category: string
  accessToken: string
}

export interface FacebookPixel {
  id: string
  name: string
  code: string
}

export interface Campaign {
  id: string
  name: string
  objective: CampaignObjective
  adSetName: string
  targeting: Targeting
  budget: Budget
  scheduling: Scheduling
  adName: string
  creative: Creative
  destination: Destination
  pixelId: string
  status: 'draft' | 'active' | 'paused' | 'deleted'
  createdAt: string
  updatedAt: string
}

export type CampaignObjective = 
  | 'CONVERSIONS'
  | 'TRAFFIC'
  | 'REACH'
  | 'BRAND_AWARENESS'
  | 'VIDEO_VIEWS'
  | 'LEAD_GENERATION'

export interface Targeting {
  ageMin: number
  ageMax: number
  locations: string[]
  interests: string[]
  gender: 'all' | 'men' | 'women'
  customAudiences?: string[]
  lookalikeAudiences?: string[]
}

export interface Budget {
  amount: number
  currency: string
  type: 'daily' | 'lifetime'
}

export interface Scheduling {
  startDate: string
  endDate?: string
  timezone: string
}

export interface Creative {
  type: 'image' | 'video'
  url: string
  title: string
  description: string
}

export interface Destination {
  url: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
}

export interface CampaignClone {
  id?: string
  originalCampaignId: string
  newCampaignId?: string
  accountId?: string
  accountName?: string
  status: 'pending' | 'success' | 'failed' | 'review'
  facebookCampaignId?: string
  error?: string
  createdAt?: string
  updatedAt?: string
}

export interface Template {
  id: string
  name: string
  description: string
  campaign: Campaign
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  facebookAccessToken?: string
  facebookUserId?: string
  createdAt: string
  updatedAt: string
}

// ===== TIPOS PARA META BUSINESS VIEW =====

export interface MetaCampaign {
  id: string
  name: string
  objective: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  effective_status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'CAMPAIGN_PAUSED' | 'CAMPAIGN_ARCHIVED'
  daily_budget?: number
  lifetime_budget?: number
  budget_type: 'daily' | 'lifetime'
  advantage_campaign_budget: boolean
  created_time: string
  updated_time: string
  account_id: string
  account_name: string
  
  // Métricas básicas
  spend: number
  impressions: number
  clicks: number
  reach: number
  frequency: number
  
  // Métricas de custo
  cpc: number
  ctr: number
  cpm: number
  cost_per_conversion: number
  cost_per_action_type: number
  cost_per_inline_link_click: number
  cost_per_unique_click: number
  cost_per_landing_page_view: number
  
  // Métricas de engajamento (apenas as válidas)
  inline_link_clicks: number
  inline_post_engagement: number
  
  // Métricas de conversão
  conversions: number
  conversion_values: number
  conversion_rate_ranking: number
  
  // Métricas de vídeo (válidas e suportadas)
  video_views: number
  video_views_25: number
  video_views_50: number
  video_views_75: number
  video_views_95: number
  video_views_100: number
  video_play_actions: number
  video_play_curve_actions: number
  
  // Métricas de qualidade
  quality_ranking: number
  engagement_rate_ranking: number
  
  // Métricas de ações (apenas as válidas)
  actions: number
  
  // Métricas de alcance e frequência (apenas as válidas)
  unique_clicks: number
  unique_inline_link_clicks: number
  unique_ctr: number
}

export interface MetaAdSet {
  id: string
  name: string
  campaign_id: string
  campaign_name: string
  campaign_advantage_budget: boolean // Se a campanha pai usa CBO
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  effective_status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'CAMPAIGN_PAUSED' | 'CAMPAIGN_ARCHIVED'
  daily_budget?: number
  lifetime_budget?: number
  budget_type: 'daily' | 'lifetime'
  bid_amount?: number
  targeting: {
    age_min: number
    age_max: number
    geo_locations: {
      countries: string[]
    }
    interests?: string[]
    genders?: number[]
  }
  spend: number
  impressions: number
  clicks: number
  cpc: number
  ctr: number
  
  // Métricas de vídeo (válidas e suportadas)
  video_views: number
  video_views_25: number
  video_views_50: number
  video_views_75: number
  video_views_95: number
  video_views_100: number
  video_play_actions: number
  video_play_curve_actions: number
  
  created_time: string
  updated_time: string
  account_id: string
  account_name: string
}

export interface MetaAd {
  id: string
  name: string
  adset_id: string
  adset_name: string
  campaign_id: string
  campaign_name: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  effective_status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'CAMPAIGN_PAUSED' | 'CAMPAIGN_ARCHIVED'
  creative: {
    id: string
    name: string
    thumbnail_url?: string
    object_story_spec?: any
  }
  spend: number
  impressions: number
  clicks: number
  cpc: number
  ctr: number
  
  // Métricas de vídeo (válidas e suportadas)
  video_views: number
  video_views_25: number
  video_views_50: number
  video_views_75: number
  video_views_95: number
  video_views_100: number
  video_play_actions: number
  video_play_curve_actions: number
  
  created_time: string
  updated_time: string
  account_id: string
  account_name: string
}

export interface MetaInsights {
  campaign_id?: string
  adset_id?: string
  ad_id?: string
  impressions: number
  clicks: number
  spend: number
  reach?: number
  frequency?: number
  cpm?: number
  cpc: number
  ctr: number
  conversions?: number
  cost_per_conversion?: number
  inline_link_clicks?: number
  inline_post_engagement?: number
  date_start: string
  date_stop: string
}

export interface MetaBusinessFilters {
  status: string[]
  search: string
  accountIds: string[]
}

export interface MetaBusinessStats {
  totalSpend: number
  totalImpressions: number
  totalClicks: number
  averageCpc: number
  averageCtr: number
  totalCampaigns: number
  totalAdSets: number
  totalAds: number
  activeCampaigns: number
  activeAdSets: number
  activeAds: number
} 