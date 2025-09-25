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
  spend: number
  impressions: number
  clicks: number
  cpc: number
  ctr: number
  created_time: string
  updated_time: string
  account_id: string
  account_name: string
}

export interface MetaAdSet {
  id: string
  name: string
  campaign_id: string
  campaign_name: string
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
  datePreset: string
  customRange?: {
    since: string
    until: string
  }
  status: string[]
  objective: string[]
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