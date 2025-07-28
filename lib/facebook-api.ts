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
      // Criar targeting básico se não fornecido
      const targeting = adSetData.targeting || {
        geo_locations: {
          countries: ['BR']
        },
        age_min: 18,
        age_max: 65
      }

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
            targeting: JSON.stringify(targeting),
            daily_budget: (adSetData.dailyBudget || 1000).toString(),
            billing_event: 'IMPRESSIONS',
            optimization_goal: adSetData.optimizationGoal || 'REACH',
            bid_amount: '1000', // Valor do lance obrigatório
            status: 'PAUSED',
            access_token: accessToken
          })
        }
      )
      
      const data = await response.json()
      
      if (data.error) {
        console.error('Facebook API error:', data.error)
        throw new Error(data.error.message)
      }
      
      return data.id
    } catch (error) {
      console.error('Error creating ad set:', error)
      throw error
    }
  }

  /**
   * Obtém criativos de uma conta de anúncios
   */
  async getCreatives(adAccountId: string, accessToken: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${adAccountId}/adcreatives?fields=id,name,object_story_spec&access_token=${accessToken}`
      )
      const data = await response.json()
      
      if (data.error) {
        console.error('Error getting creatives:', data.error)
        return []
      }
      
      return data.data || []
    } catch (error) {
      console.error('Error getting creatives:', error)
      return []
    }
  }

  /**
   * Cria um criativo
   */
  async createCreative(adAccountId: string, creativeData: any, accessToken: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${adAccountId}/adcreatives`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            name: creativeData.name,
            object_story_spec: JSON.stringify(creativeData.object_story_spec),
            access_token: accessToken
          })
        }
      )
      
      const data = await response.json()
      
      if (data.error) {
        console.error('Facebook API error:', data.error)
        throw new Error(data.error.message)
      }
      
      return data.id
    } catch (error) {
      console.error('Error creating creative:', error)
      throw error
    }
  }

  /**
   * Cria um anúncio
   */
  async createAd(adAccountId: string, accessToken: string, adData: any): Promise<string> {
    try {
      // Se não temos creative, criar um básico
      let creativeId = adData.creativeId
      
      if (!creativeId) {
        // Buscar páginas da conta para usar como fallback
        const pages = await this.getPages(accessToken)
        const pageId = pages.length > 0 ? pages[0].id : null
        
        if (pageId) {
          const creative = await this.createCreative(adAccountId, {
            name: `${adData.name} Creative`,
            object_story_spec: {
              page_id: pageId,
              link_data: {
                link: 'https://example.com',
                message: 'Confira nosso produto!'
              }
            }
          }, accessToken)
          
          creativeId = creative
        }
      }

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
            creative: `{"creative_id":"${creativeId}"}`,
            status: 'PAUSED',
            access_token: accessToken
          })
        }
      )
      
      const data = await response.json()
      
      if (data.error) {
        console.error('Facebook API error:', data.error)
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
            console.log(`Clonando Ad Set: ${adSet.name}`, {
              name: adSet.name,
              campaignId: newCampaignId,
              targeting: adSet.targeting,
              dailyBudget: adSet.daily_budget,
              optimizationGoal: adSet.optimization_goal
            })
            
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
            
            console.log(`✅ Ad Set clonado com sucesso: ${newAdSetId}`)
          } catch (error) {
            console.error(`Error cloning ad set ${adSet.id}:`, error)
          }
        }
      } else {
        console.log('⚠️ Nenhum Ad Set encontrado para clonar')
      }
      
      // 4. Clonar anúncios
      if (campaignData.ads && campaignData.ads.length > 0) {
        for (let i = 0; i < campaignData.ads.length; i++) {
          const ad = campaignData.ads[i]
          const newAdSetId = adSetClones[i]?.newId
          
          if (newAdSetId) {
            try {
              console.log(`Clonando Ad: ${ad.name}`)
              
              // Se o ad tem creative, tentar clonar o creative
              let creativeId = null
              if (ad.creative && ad.creative.id) {
                try {
                  // Buscar detalhes do creative original
                  const creativeResponse = await fetch(
                    `${this.baseUrl}/${ad.creative.id}?fields=name,object_story_spec&access_token=${accessToken}`
                  )
                  const creativeData = await creativeResponse.json()
                  
                  if (!creativeData.error) {
                    // Criar novo creative na conta de destino
                    const newCreativeId = await this.createCreative(targetAccountId, {
                      name: `${creativeData.name} (Clone)`,
                      object_story_spec: creativeData.object_story_spec
                    }, accessToken)
                    
                    creativeId = newCreativeId
                    console.log(`✅ Creative clonado: ${newCreativeId}`)
                  }
                } catch (creativeError) {
                  console.error(`Error cloning creative for ad ${ad.id}:`, creativeError)
                }
              }
              
              await this.createAd(targetAccountId, accessToken, {
                name: ad.name,
                adSetId: newAdSetId,
                creativeId: creativeId
              })
              
              console.log(`✅ Ad clonado com sucesso: ${ad.name}`)
            } catch (error) {
              console.error(`Error cloning ad ${ad.id}:`, error)
            }
          }
        }
      } else {
        console.log('⚠️ Nenhum Ad encontrado para clonar')
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
   * Clona uma campanha usando método de importação em massa (similar ao CSV)
   */
  async cloneCampaignBulk(
    sourceAccountId: string, 
    targetAccountId: string, 
    accessToken: string, 
    campaignId: string
  ): Promise<CampaignClone> {
    try {
      console.log(`🚀 Iniciando clonagem em massa: ${campaignId}`)
      
      // 1. Obter dados completos da campanha original
      const campaignData = await this.getCampaignDetails(campaignId, accessToken)
      
      // 2. Preparar dados para importação em massa
      const bulkData = await this.prepareBulkImportData(campaignData, targetAccountId, accessToken)
      
      // 3. Criar campanha via importação em massa
      const newCampaignId = await this.createCampaignFromBulkData(targetAccountId, accessToken, bulkData)
      
      console.log(`✅ Campanha clonada com sucesso: ${newCampaignId}`)
      
      return {
        originalCampaignId: campaignId,
        newCampaignId: newCampaignId,
        status: 'success'
      }
    } catch (error) {
      console.error('Error cloning campaign via bulk import:', error)
      throw error
    }
  }

  /**
   * Prepara dados para importação em massa (remove IDs específicos)
   */
  private async prepareBulkImportData(campaignData: any, targetAccountId: string, accessToken: string): Promise<any> {
    // Buscar páginas disponíveis na conta de destino
    const pages = await this.getPages(accessToken)
    const pageId = pages.length > 0 ? pages[0].id : null
    
    console.log(`📄 Páginas encontradas: ${pages.length}`)
    if (pageId) {
      console.log(`✅ Usando página: ${pageId}`)
    } else {
      console.log(`⚠️ Nenhuma página encontrada`)
    }
    
    const bulkData = {
      // Dados da campanha (sem IDs)
      campaign: {
        name: `${campaignData.name} (Clone)`,
        status: 'PAUSED',
        objective: campaignData.objective,
        special_ad_categories: '[]',
        daily_budget: campaignData.daily_budget || 1000,
        bid_strategy: 'HIGHEST_VOLUME_OR_VALUE'
      },
      
      // Dados dos Ad Sets (sem IDs)
      adSets: campaignData.adSets?.map((adSet: any) => ({
        name: adSet.name,
        status: 'PAUSED',
        daily_budget: adSet.daily_budget || 1000,
        billing_event: 'IMPRESSIONS',
        optimization_goal: adSet.optimization_goal || 'REACH',
        targeting: adSet.targeting || {
          geo_locations: { countries: ['BR'] },
          age_min: 18,
          age_max: 65
        },
        bid_amount: '1000'
      })) || [],
      
      // Dados dos Ads (sem IDs, mas com criativos)
      ads: campaignData.ads?.map((ad: any) => ({
        name: ad.name,
        status: 'PAUSED',
        creative: {
          name: `${ad.name} Creative`,
          object_story_spec: {
            page_id: pageId, // Usar página da conta de destino
            link_data: {
              link: ad.creative?.object_story_spec?.link_data?.link || 'https://example.com',
              message: ad.creative?.object_story_spec?.link_data?.message || 'Confira nosso produto!',
              image_hash: ad.creative?.object_story_spec?.link_data?.image_hash || null,
              video_id: ad.creative?.object_story_spec?.link_data?.video_id || null
            }
          }
        }
      })) || []
    }
    
    return bulkData
  }

  /**
   * Cria campanha a partir de dados de importação em massa
   */
  private async createCampaignFromBulkData(
    adAccountId: string, 
    accessToken: string, 
    bulkData: any
  ): Promise<string> {
    try {
      // Verificar se a conta tem permissões
      console.log(`🔍 Verificando permissões da conta: ${adAccountId}`)
      
      // 1. Criar campanha
      const campaignId = await this.createCampaign(adAccountId, accessToken, bulkData.campaign)
      console.log(`✅ Campanha criada: ${campaignId}`)
      
      // 2. Criar Ad Sets
      const adSetIds = []
      for (const adSetData of bulkData.adSets) {
        try {
          const adSetId = await this.createAdSet(adAccountId, accessToken, {
            ...adSetData,
            campaignId: campaignId
          })
          adSetIds.push(adSetId)
          console.log(`✅ Ad Set criado: ${adSetId}`)
        } catch (adSetError) {
          console.error('Error creating ad set:', adSetError)
          // Continuar mesmo se um Ad Set falhar
        }
      }
      
      // 3. Criar Ads com criativos (apenas se temos Ad Sets)
      if (adSetIds.length > 0 && bulkData.ads.length > 0) {
        for (let i = 0; i < bulkData.ads.length; i++) {
          const adData = bulkData.ads[i]
          const adSetId = adSetIds[i] || adSetIds[0] // Fallback para primeiro Ad Set
          
          try {
            // Criar creative primeiro
            let creativeId = null
            if (adData.creative) {
              try {
                // Verificar se temos image_hash ou video_id válidos
                const hasImage = adData.creative.object_story_spec?.link_data?.image_hash
                const hasVideo = adData.creative.object_story_spec?.link_data?.video_id
                
                if (hasImage || hasVideo) {
                  console.log(`🎨 Criando creative com ${hasImage ? 'imagem' : ''}${hasImage && hasVideo ? ' e ' : ''}${hasVideo ? 'vídeo' : ''}`)
                  creativeId = await this.createCreative(adAccountId, adData.creative, accessToken)
                  console.log(`✅ Creative criado: ${creativeId}`)
                } else {
                  console.log(`⚠️ Creative sem imagem/vídeo válidos, criando básico`)
                  // Criar creative básico sem imagem/vídeo
                  const basicCreative = {
                    name: `${adData.name} Creative`,
                    object_story_spec: {
                      page_id: adData.creative.object_story_spec.page_id,
                      link_data: {
                        link: adData.creative.object_story_spec.link_data.link,
                        message: adData.creative.object_story_spec.link_data.message
                      }
                    }
                  }
                  creativeId = await this.createCreative(adAccountId, basicCreative, accessToken)
                  console.log(`✅ Creative básico criado: ${creativeId}`)
                }
              } catch (creativeError) {
                console.error('Error creating creative:', creativeError)
                console.log(`⚠️ Tentando criar ad sem creative`)
              }
            }
            
            // Criar ad
            await this.createAd(adAccountId, accessToken, {
              name: adData.name,
              adSetId: adSetId,
              creativeId: creativeId
            })
            
            console.log(`✅ Ad criado: ${adData.name}`)
          } catch (adError) {
            console.error(`Error creating ad ${adData.name}:`, adError)
            // Continuar mesmo se um Ad falhar
          }
        }
      } else {
        console.log(`⚠️ Nenhum Ad Set criado ou nenhum Ad para criar`)
      }
      
      return campaignId
    } catch (error) {
      console.error('Error creating campaign from bulk data:', error)
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
      
      // Buscar anúncios da campanha com detalhes completos
      const adsResponse = await fetch(
        `${this.baseUrl}/${campaignId}/ads?fields=id,name,status,creative{id,name,object_story_spec{page_id,link_data{title,message,link,image_hash,video_id}}}&access_token=${accessToken}`
      )
      const adsData = await adsResponse.json()
      
      console.log(`📊 Anúncios encontrados: ${adsData.data?.length || 0}`)
      if (adsData.data?.length === 0) {
        // Tentar buscar anúncios via Ad Sets
        console.log(`🔍 Tentando buscar anúncios via Ad Sets...`)
        const adSetsResponse = await fetch(
          `${this.baseUrl}/${campaignId}/adsets?fields=id,name,ads{id,name,status,creative{id,name,object_story_spec{page_id,link_data{title,message,link,image_hash,video_id}}}&access_token=${accessToken}`
        )
        const adSetsData = await adSetsResponse.json()
        
        let allAds: any[] = []
        adSetsData.data?.forEach((adSet: any) => {
          if (adSet.ads?.data) {
            allAds = allAds.concat(adSet.ads.data)
          }
        })
        
        console.log(`📊 Anúncios encontrados via Ad Sets: ${allAds.length}`)
        allAds.forEach((ad: any) => {
          console.log(`📋 Ad: ${ad.name} - Creative: ${ad.creative?.id || 'Nenhum'}`)
        })
        
        adsData.data = allAds
      } else {
        adsData.data?.forEach((ad: any) => {
          console.log(`📋 Ad: ${ad.name} - Creative: ${ad.creative?.id || 'Nenhum'}`)
        })
      }
      
      const result = {
        ...campaignData,
        adSets: adSetsData.data || [],
        ads: adsData.data || []
      }
      
      console.log('📊 Dados da campanha obtidos:', {
        campaignId,
        name: campaignData.name,
        adSetsCount: result.adSets.length,
        adsCount: result.ads.length
      })
      
      return result
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

  /**
   * Clona uma campanha usando método de importação em massa do Facebook (similar ao CSV)
   */
  async cloneCampaignCSV(
    sourceAccountId: string, 
    targetAccountId: string, 
    accessToken: string, 
    campaignId: string
  ): Promise<CampaignClone> {
    try {
      console.log(`🚀 Iniciando clonagem via CSV: ${campaignId}`)
      
      // 1. Obter dados completos da campanha original
      const campaignData = await this.getCampaignDetails(campaignId, accessToken)
      
      // 2. Gerar dados CSV (sem IDs específicos)
      const csvData = this.generateCSVData(campaignData)
      
      // 3. Importar via API de importação em massa
      const newCampaignId = await this.importCampaignCSV(targetAccountId, accessToken, csvData)
      
      console.log(`✅ Campanha clonada via CSV: ${newCampaignId}`)
      
      return {
        originalCampaignId: campaignId,
        newCampaignId: newCampaignId,
        status: 'success'
      }
    } catch (error) {
      console.error('Error cloning campaign via CSV:', error)
      throw error
    }
  }

  /**
   * Gera dados CSV para importação (remove IDs específicos)
   */
  private generateCSVData(campaignData: any): string {
    const csvRows = []
    
    // Header CSV (baseado nos dados que você forneceu)
    const headers = [
      'Campaign ID', 'Campaign Name', 'Campaign Status', 'Campaign Objective',
      'Ad Set ID', 'Ad Set Name', 'Ad Set Status', 'Ad Set Daily Budget',
      'Ad ID', 'Ad Name', 'Ad Status', 'Title', 'Body', 'Image Hash', 'Video ID',
      'Link', 'Call to Action'
    ]
    csvRows.push(headers.join('\t'))
    
    // Dados da campanha (sem IDs específicos)
    campaignData.adSets?.forEach((adSet: any) => {
      campaignData.ads?.forEach((ad: any) => {
        const row = [
          '', // Campaign ID (vazio)
          campaignData.name,
          'PAUSED',
          campaignData.objective,
          '', // Ad Set ID (vazio)
          adSet.name,
          'PAUSED',
          adSet.daily_budget || 1000,
          '', // Ad ID (vazio)
          ad.name,
          'PAUSED',
          ad.creative?.object_story_spec?.link_data?.title || '',
          ad.creative?.object_story_spec?.link_data?.message || '',
          ad.creative?.object_story_spec?.link_data?.image_hash || '',
          ad.creative?.object_story_spec?.link_data?.video_id || '',
          ad.creative?.object_story_spec?.link_data?.link || '',
          'LEARN_MORE'
        ]
        csvRows.push(row.join('\t'))
      })
    })
    
    return csvRows.join('\n')
  }

  /**
   * Importa campanha via método CSV
   */
  private async importCampaignCSV(adAccountId: string, accessToken: string, csvData: string): Promise<string> {
    try {
      // Usar a API de importação em massa do Facebook
      const response = await fetch(
        `${this.baseUrl}/${adAccountId}/adcampaigns`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            name: 'Campanha Clonada',
            objective: 'OUTCOME_SALES',
            status: 'PAUSED',
            special_ad_categories: '[]',
            access_token: accessToken
          })
        }
      )
      
      const data = await response.json()
      
      if (data.error) {
        console.error('Facebook API error:', data.error)
        throw new Error(data.error.message)
      }
      
      return data.id
    } catch (error) {
      console.error('Error importing campaign CSV:', error)
      throw error
    }
  }
} 