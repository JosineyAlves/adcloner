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
  id: string
  originalCampaignId: string
  accountId: string
  accountName: string
  status: 'pending' | 'success' | 'failed' | 'review'
  facebookCampaignId?: string
  error?: string
  createdAt: string
  updatedAt: string
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