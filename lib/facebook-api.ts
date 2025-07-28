import { FacebookAccount, FacebookPage, FacebookPixel, Campaign, CampaignClone } from './types'

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
      // Buscar pixels através das contas de anúncios
      const adAccounts = await this.getAdAccounts(userAccessToken)
      const allPixels: FacebookPixel[] = []
      
      for (const account of adAccounts) {
        try {
          const response = await fetch(
            `${this.baseUrl}/${account.id}/pixels?fields=id,name,code&access_token=${userAccessToken}`
          )
          const data = await response.json()
          
          if (data.data) {
            data.data.forEach((pixel: any) => {
              allPixels.push({
                id: pixel.id,
                name: pixel.name,
                code: pixel.code
              })
            })
          }
        } catch (error) {
          console.error(`Error getting pixels for account ${account.id}:`, error)
        }
      }
      
      console.log('📊 Pixels encontrados:', allPixels.length)
      return allPixels
    } catch (error) {
      console.error('Error getting pixels:', error)
      return [] // Retornar array vazio em caso de erro
    }
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
      const adSetClones = await Promise.all(
        campaignData.adSets.map(async (adSet: any) => {
          const newAdSetId = await this.createAdSet(targetAccountId, accessToken, {
            name: adSet.name,
            campaignId: newCampaignId,
            targeting: adSet.targeting,
            dailyBudget: adSet.dailyBudget,
            optimizationGoal: adSet.optimizationGoal
          })
          
          return {
            originalId: adSet.id,
            newId: newAdSetId
          }
        })
      )
      
      // 4. Clonar anúncios
      await Promise.all(
        campaignData.ads.map(async (ad: any, index: number) => {
          const newAdSetId = adSetClones[index]?.newId
          if (newAdSetId) {
            await this.createAd(targetAccountId, accessToken, {
              name: ad.name,
              adSetId: newAdSetId,
              creative: ad.creative
            })
          }
        })
      )
      
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
      const response = await fetch(
        `${this.baseUrl}/${campaignId}?fields=id,name,objective,adsets{id,name,targeting,daily_budget,optimization_goal},ads{id,name,creative}&access_token=${accessToken}`
      )
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }
      
      return data
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