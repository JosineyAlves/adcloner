import { FacebookAccount, FacebookPage, FacebookPixel, Campaign, CampaignClone, CampaignObjective } from './types'

export class FacebookAPI {
  private appId: string
  private appSecret: string
  private baseUrl: string = 'https://graph.facebook.com/v23.0'

  constructor() {
    this.appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ''
    this.appSecret = process.env.FACEBOOK_APP_SECRET || ''
  }

  // ===== RATE LIMITING E RETRY =====

  /**
   * Implementa retry com backoff exponencial para rate limits
   */
  private async withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error: any) {
        // Verificar se é um erro de rate limit
        const isRateLimitError = error?.code === 4 || 
                               error?.code === 17 || 
                               error?.code === 341 || 
                               error?.code === 613 ||
                               error?.message?.includes('rate limit')

        if (isRateLimitError && i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000 // Backoff exponencial
          console.log(`Rate limit hit, retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        
        throw error
      }
    }
    throw new Error('Max retries exceeded')
  }

  /**
   * Faz chamada para API Graph com retry automático
   */
  private async makeApiCall(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    
    // Adicionar parâmetros à URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString())
      }
    })

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const data = await response.json()

    if (data.error) {
      const error = new Error(data.error.message)
      ;(error as any).code = data.error.code
      throw error
    }

    return data
  }

  // ===== AUTENTICAÇÃO E TOKENS =====

  /**
   * Obtém informações do usuário usando User Access Token
   */
  async getUserInfo(accessToken: string) {
    return this.withRetry(async () => {
      return this.makeApiCall('/me', {
        fields: 'id,name,email',
        access_token: accessToken
      })
    })
  }

  /**
   * Converte token de curta duração para longa duração
   */
  async exchangeToken(shortLivedToken: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/oauth/access_token?grant_type=fb_exchange_token&client_id=${this.appId}&client_secret=${this.appSecret}&fb_exchange_token=${shortLivedToken}`
      )
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }
      
      return data.access_token
    } catch (error) {
      console.error('Error exchanging token:', error)
      throw error
    }
  }

  /**
   * Obtém Page Access Token para uma página específica
   */
  async getPageAccessToken(userAccessToken: string, pageId: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${pageId}?fields=access_token&access_token=${userAccessToken}`
      )
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }
      
      return data.access_token
    } catch (error) {
      console.error('Error getting page access token:', error)
      throw error
    }
  }

  // ===== CONTAS DE ANÚNCIOS =====

  /**
   * Obtém todas as contas de anúncios do usuário
   */
  async getAdAccounts(userAccessToken: string): Promise<FacebookAccount[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me/adaccounts?fields=id,name,account_status,account_id,business_name,currency,timezone_name,status&access_token=${userAccessToken}`
      )
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }
      
      return data.data.map((account: any) => ({
        id: account.id,
        name: account.name,
        businessManagerId: account.business_name || 'Unknown',
        businessManagerName: account.business_name || 'Unknown',
        status: this.mapAccountStatus(account.account_status),
        tokenStatus: 'valid',
        pages: [],
        pixels: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error getting ad accounts:', error)
      throw error
    }
  }

  /**
   * Obtém páginas do usuário
   */
  async getPages(userAccessToken: string): Promise<FacebookPage[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me/accounts?fields=id,name,category,access_token&access_token=${userAccessToken}`
      )
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }
      
      return data.data.map((page: any) => ({
        id: page.id,
        name: page.name,
        category: page.category,
        accessToken: page.access_token
      }))
    } catch (error) {
      console.error('Error getting pages:', error)
      throw error
    }
  }

  /**
   * Obtém pixels do usuário
   */
  async getPixels(userAccessToken: string): Promise<FacebookPixel[]> {
    try {
      // Buscar pixels através das contas de anúncios usando a nova estrutura
      const adAccounts = await this.getAdAccounts(userAccessToken)
      const allPixels: FacebookPixel[] = []
      
      for (const account of adAccounts) {
        try {
          // Nova estrutura: buscar data_sets (que incluem pixels)
          const response = await fetch(
            `${this.baseUrl}/${account.id}/data_sets?fields=id,name,type,data_sources&access_token=${userAccessToken}`
          )
          const data = await response.json()
          
          if (data.data) {
            data.data.forEach((dataSet: any) => {
              // Filtrar apenas pixels (type = 'PIXEL')
              if (dataSet.type === 'PIXEL') {
                allPixels.push({
                  id: dataSet.id,
                  name: dataSet.name,
                  code: dataSet.id // Usar ID como código temporário
                })
              }
            })
          }
        } catch (error) {
          console.error(`Error getting data sets for account ${account.id}:`, error)
          
          // Fallback: tentar buscar pixels diretamente (método antigo)
          try {
            const fallbackResponse = await fetch(
              `${this.baseUrl}/${account.id}/pixels?fields=id,name,code&access_token=${userAccessToken}`
            )
            const fallbackData = await fallbackResponse.json()
            
            if (fallbackData.data) {
              fallbackData.data.forEach((pixel: any) => {
                allPixels.push({
                  id: pixel.id,
                  name: pixel.name,
                  code: pixel.code
                })
              })
            }
          } catch (fallbackError) {
            console.error(`Error getting pixels (fallback) for account ${account.id}:`, fallbackError)
          }
        }
      }
      
      console.log('📊 Pixels/Data Sets encontrados:', allPixels.length)
      return allPixels
    } catch (error) {
      console.error('Error getting pixels:', error)
      return [] // Retornar array vazio em caso de erro
    }
  }

  /**
   * Obtém campanhas de uma conta de anúncios
   */
  async getCampaigns(adAccountId: string, accessToken: string): Promise<Campaign[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${adAccountId}/campaigns?fields=id,name,objective,status,created_time,updated_time,insights{impressions,clicks,spend}&access_token=${accessToken}`
      )
      const data = await response.json()
      
      if (data.error) {
        console.error('Error getting campaigns:', data.error)
        return []
      }
      
      const campaigns: Campaign[] = []
      if (data.data) {
        data.data.forEach((campaign: any) => {
          const insights = campaign.insights?.data?.[0] || {}
          
          campaigns.push({
            id: campaign.id,
            name: campaign.name,
            objective: this.mapCampaignObjective(campaign.objective),
            adSetName: `Ad Set for ${campaign.name}`,
            targeting: {
              ageMin: 18,
              ageMax: 65,
              locations: ['BR'],
              interests: [],
              gender: 'all'
            },
            budget: {
              amount: 100,
              currency: 'BRL',
              type: 'daily'
            },
            scheduling: {
              startDate: campaign.created_time,
              timezone: 'America/Sao_Paulo'
            },
            adName: `Ad for ${campaign.name}`,
            creative: {
              type: 'image',
              url: 'https://via.placeholder.com/1200x630',
              title: campaign.name,
              description: 'Descrição do anúncio'
            },
            destination: {
              url: 'https://example.com',
              utmSource: 'facebook',
              utmMedium: 'cpc',
              utmCampaign: campaign.name
            },
            pixelId: '',
            status: this.mapCampaignStatus(campaign.status),
            createdAt: campaign.created_time,
            updatedAt: campaign.updated_time
          })
        })
      }
      
      console.log(`📊 Campanhas encontradas para conta ${adAccountId}:`, campaigns.length)
      return campaigns
    } catch (error) {
      console.error('Error getting campaigns:', error)
      return []
    }
  }

  /**
   * Mapeia objetivo da campanha do Facebook para nosso tipo
   */
  private mapCampaignObjective(objective: string): CampaignObjective {
    const mapping: Record<string, CampaignObjective> = {
      'CONVERSIONS': 'CONVERSIONS',
      'LINK_CLICKS': 'TRAFFIC',
      'REACH': 'REACH',
      'BRAND_AWARENESS': 'BRAND_AWARENESS',
      'VIDEO_VIEWS': 'VIDEO_VIEWS',
      'LEAD_GENERATION': 'LEAD_GENERATION'
    }
    
    return mapping[objective] || 'TRAFFIC'
  }

  /**
   * Mapeia status da campanha do Facebook para nosso tipo
   */
  private mapCampaignStatus(status: string): 'draft' | 'active' | 'paused' | 'deleted' {
    const mapping: Record<string, 'draft' | 'active' | 'paused' | 'deleted'> = {
      'ACTIVE': 'active',
      'PAUSED': 'paused',
      'DELETED': 'deleted',
      'DRAFT': 'draft'
    }
    
    return mapping[status] || 'draft'
  }

  // ===== CAMPANHAS E ANÚNCIOS =====

  /**
   * Cria uma nova campanha
   */
  async createCampaign(adAccountId: string, accessToken: string, campaignData: any): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${adAccountId}/campaigns`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            name: campaignData.name,
            objective: campaignData.objective,
            status: 'PAUSED', // Sempre criar pausada
            special_ad_categories: '[]', // Parâmetro obrigatório - array vazio para nenhuma categoria especial
            access_token: accessToken
          })
        }
      )
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }
      
      return data.id
    } catch (error) {
      console.error('Error creating campaign:', error)
      throw error
    }
  }

  /**
   * Cria um conjunto de anúncios
   */
  async createAdSet(adAccountId: string, accessToken: string, adSetData: any): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${adAccountId}/adsets`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            name: adSetData.name,
            campaign_id: adSetData.campaignId,
            targeting: JSON.stringify(adSetData.targeting),
            daily_budget: adSetData.dailyBudget.toString(),
            billing_event: 'IMPRESSIONS',
            optimization_goal: adSetData.optimizationGoal,
            status: 'PAUSED',
            access_token: accessToken
          })
        }
      )
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }
      
      return data.id
    } catch (error) {
      console.error('Error creating ad set:', error)
      throw error
    }
  }

  /**
   * Cria um anúncio
   */
  async createAd(adAccountId: string, accessToken: string, adData: any): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${adAccountId}/ads`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            name: adData.name,
            adset_id: adData.adSetId,
            creative: JSON.stringify(adData.creative),
            status: 'PAUSED',
            access_token: accessToken
          })
        }
      )
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }
      
      return data.id
    } catch (error) {
      console.error('Error creating ad:', error)
      throw error
    }
  }

  /**
   * Clona uma campanha para outra conta
   */
  async cloneCampaign(
    sourceAccountId: string, 
    targetAccountId: string, 
    accessToken: string, 
    campaignId: string
  ): Promise<CampaignClone> {
    try {
      // 1. Obter dados da campanha original
      const campaignData = await this.getCampaignDetails(campaignId, accessToken)
      
      // 2. Criar nova campanha na conta de destino
      const newCampaignId = await this.createCampaign(targetAccountId, accessToken, {
        name: `${campaignData.name} (Clone)`,
        objective: campaignData.objective
      })
      
      // 3. Clonar conjuntos de anúncios
      const adSetClones = []
      if (campaignData.adSets && campaignData.adSets.length > 0) {
        for (const adSet of campaignData.adSets) {
          try {
            const newAdSetId = await this.createAdSet(targetAccountId, accessToken, {
              name: adSet.name,
              campaignId: newCampaignId,
              targeting: adSet.targeting || {},
              dailyBudget: adSet.daily_budget || 1000,
              optimizationGoal: adSet.optimization_goal || 'REACH'
            })
            
            adSetClones.push({
              originalId: adSet.id,
              newId: newAdSetId
            })
          } catch (error) {
            console.error(`Error cloning ad set ${adSet.id}:`, error)
          }
        }
      }
      
      // 4. Clonar anúncios
      if (campaignData.ads && campaignData.ads.length > 0) {
        for (let i = 0; i < campaignData.ads.length; i++) {
          const ad = campaignData.ads[i]
          const newAdSetId = adSetClones[i]?.newId
          
          if (newAdSetId) {
            try {
              await this.createAd(targetAccountId, accessToken, {
                name: ad.name,
                adSetId: newAdSetId,
                creative: ad.creative || {}
              })
            } catch (error) {
              console.error(`Error cloning ad ${ad.id}:`, error)
            }
          }
        }
      }
      
      return {
        id: `clone_${Date.now()}`,
        originalCampaignId: campaignId,
        accountId: targetAccountId,
        accountName: 'Target Account',
        status: 'success',
        facebookCampaignId: newCampaignId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
    } catch (error) {
      console.error('Error cloning campaign:', error)
      throw error
    }
  }

  /**
   * Obtém detalhes de uma campanha
   */
  async getCampaignDetails(campaignId: string, accessToken: string) {
    try {
      // Buscar detalhes da campanha
      const campaignResponse = await fetch(
        `${this.baseUrl}/${campaignId}?fields=id,name,objective&access_token=${accessToken}`
      )
      const campaignData = await campaignResponse.json()
      
      if (campaignData.error) {
        throw new Error(campaignData.error.message)
      }
      
      // Buscar conjuntos de anúncios da campanha
      const adSetsResponse = await fetch(
        `${this.baseUrl}/${campaignId}/adsets?fields=id,name,targeting,daily_budget,optimization_goal&access_token=${accessToken}`
      )
      const adSetsData = await adSetsResponse.json()
      
      // Buscar anúncios da campanha
      const adsResponse = await fetch(
        `${this.baseUrl}/${campaignId}/ads?fields=id,name,creative&access_token=${accessToken}`
      )
      const adsData = await adsResponse.json()
      
      return {
        ...campaignData,
        adSets: adSetsData.data || [],
        ads: adsData.data || []
      }
    } catch (error) {
      console.error('Error getting campaign details:', error)
      throw error
    }
  }

  // ===== INSIGHTS E RELATÓRIOS =====

  /**
   * Obtém insights de uma campanha
   */
  async getCampaignInsights(campaignId: string, accessToken: string, datePreset: string = 'last_7d') {
    try {
      const response = await fetch(
        `${this.baseUrl}/${campaignId}/insights?fields=impressions,clicks,spend,conversions&date_preset=${datePreset}&access_token=${accessToken}`
      )
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }
      
      return data.data[0] || {}
    } catch (error) {
      console.error('Error getting campaign insights:', error)
      throw error
    }
  }

  // ===== UTILITÁRIOS =====

  /**
   * Mapeia status da conta do Facebook
   */
  private mapAccountStatus(status: number): 'active' | 'disabled' | 'pending' {
    switch (status) {
      case 1:
        return 'active'
      case 2:
        return 'disabled'
      case 3:
        return 'pending'
      default:
        return 'pending'
    }
  }

  /**
   * Verifica se um token é válido
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/me?access_token=${accessToken}`)
      const data = await response.json()
      
      return !data.error
    } catch (error) {
      return false
    }
  }

  /**
   * Obtém permissões do usuário
   */
  async getUserPermissions(accessToken: string): Promise<string[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me/permissions?access_token=${accessToken}`
      )
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }
      
      return data.data.map((perm: any) => perm.permission)
    } catch (error) {
      console.error('Error getting user permissions:', error)
      return []
    }
  }
} 