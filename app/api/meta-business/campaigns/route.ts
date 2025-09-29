import { NextRequest, NextResponse } from 'next/server'
import { FacebookAPI } from '@/lib/facebook-api'
import { MetaCampaign } from '@/lib/types'
import { facebookRateLimiter } from '@/lib/rate-limiter'
import { cache } from '@/lib/cache'
import { facebookBatchAPI } from '@/lib/facebook-batch-api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('fb_access_token')?.value
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const datePreset = searchParams.get('datePreset') || 'today'
    const since = searchParams.get('since')
    const until = searchParams.get('until')

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found' },
        { status: 401 }
      )
    }

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }

    const facebookAPI = new FacebookAPI()
    
    // Verificar cache primeiro com TTL inteligente
    const cacheKey = cache.generateKey('campaigns', { accountId, datePreset, since, until })
    const cachedData = cache.get(cacheKey)
    
    if (cachedData) {
      console.log('📦 Retornando campanhas do cache (TTL inteligente)')
      return NextResponse.json(cachedData)
    }
    
    try {
      console.log('🚀 Iniciando busca de campanhas com Batch Requests')
      
      // PASSO 1: Buscar campanhas usando batch request
      const campaignsBatch = facebookBatchAPI.createCampaignsBatch(accountId, datePreset, since, until)
      const campaignsResponses = await facebookBatchAPI.makeBatchRequest(campaignsBatch, accessToken)
      
      if (campaignsResponses[0].code !== 200) {
        const errorData = JSON.parse(campaignsResponses[0].body || '{}')
        console.error('❌ Erro ao buscar campanhas:', errorData)
        return NextResponse.json(
          { error: errorData.error?.message || 'Failed to fetch campaigns' },
          { status: 400 }
        )
      }

      const campaignsData = JSON.parse(campaignsResponses[0].body || '{}')
      const campaigns: MetaCampaign[] = []
      
      if (campaignsData.data && campaignsData.data.length > 0) {
        console.log(`📊 Encontradas ${campaignsData.data.length} campanhas`)
        
        // PASSO 2: Buscar insights em batch (até 50 por vez)
        const campaignIds = campaignsData.data.map((c: any) => c.id)
        const insightsBatch = facebookBatchAPI.createCampaignInsightsBatch(campaignIds, datePreset, since, until)
        const insightsResponses = await facebookBatchAPI.makeBatchRequest(insightsBatch, accessToken)
        
        console.log(`📈 Buscando insights para ${campaignIds.length} campanhas em ${Math.ceil(insightsBatch.length / 50)} lotes`)
        
        // PASSO 3: Processar campanhas com insights
        for (let i = 0; i < campaignsData.data.length; i++) {
          const campaign = campaignsData.data[i]
          const insightsResponse = insightsResponses[i]
          
          let insights = {
            impressions: 0,
            clicks: 0,
            spend: 0,
            cpc: 0,
            ctr: 0
          }

          if (insightsResponse.code === 200) {
            const insightsData = JSON.parse(insightsResponse.body || '{}')
            if (insightsData.data && insightsData.data.length > 0) {
              const insight = insightsData.data[0]
              insights = {
                impressions: parseInt(insight.impressions || '0'),
                clicks: parseInt(insight.clicks || '0'),
                spend: parseFloat(insight.spend || '0'),
                cpc: parseFloat(insight.cpc || '0'),
                ctr: parseFloat(insight.ctr || '0')
              }
            }
          } else {
            console.warn(`⚠️ Erro ao buscar insights da campanha ${campaign.id}:`, insightsResponse)
          }

          // Verificar se tem Advantage Campaign Budget (simplificado)
          const advantageCampaignBudget = !!(campaign.daily_budget || campaign.lifetime_budget)

            const metaCampaign: MetaCampaign = {
              id: campaign.id,
              name: campaign.name,
              objective: campaign.objective,
              status: campaign.status,
              effective_status: campaign.effective_status || campaign.status,
              daily_budget: campaign.daily_budget ? Math.round(parseInt(campaign.daily_budget) / 100) : undefined,
              lifetime_budget: campaign.lifetime_budget ? Math.round(parseInt(campaign.lifetime_budget) / 100) : undefined,
              budget_type: campaign.daily_budget ? 'daily' : 'lifetime',
              advantage_campaign_budget: advantageCampaignBudget,
              spend: insights.spend,
              impressions: insights.impressions,
              clicks: insights.clicks,
              cpc: insights.cpc,
              ctr: insights.ctr,
              created_time: campaign.created_time,
              updated_time: campaign.updated_time,
              account_id: accountId,
              account_name: 'Facebook Account' // TODO: Buscar nome da conta
            }

            campaigns.push(metaCampaign)
          } catch (error) {
            console.error(`Error processing campaign ${campaign.id}:`, error)
            // Adicionar campanha sem insights em caso de erro
            // Em caso de erro, assumir CBO se tem orçamento
            const fallbackAdvantageBudget = !!(campaign.daily_budget || campaign.lifetime_budget)
            
            campaigns.push({
              id: campaign.id,
              name: campaign.name,
              objective: campaign.objective,
              status: campaign.status,
              effective_status: campaign.effective_status || campaign.status,
              daily_budget: campaign.daily_budget ? Math.round(parseInt(campaign.daily_budget) / 100) : undefined,
              lifetime_budget: campaign.lifetime_budget ? Math.round(parseInt(campaign.lifetime_budget) / 100) : undefined,
              budget_type: campaign.daily_budget ? 'daily' : 'lifetime',
              advantage_campaign_budget: fallbackAdvantageBudget,
              spend: 0,
              impressions: 0,
              clicks: 0,
              cpc: 0,
              ctr: 0,
              created_time: campaign.created_time,
              updated_time: campaign.updated_time,
              account_id: accountId,
              account_name: 'Facebook Account'
            })
          }
        }
      }

      const result = { campaigns }
      
      // Salvar no cache com TTL inteligente (15 minutos para campanhas)
      cache.setWithIntelligentTTL(cacheKey, result, 'campaigns')
      
      console.log(`✅ Campanhas processadas com sucesso: ${campaigns.length} itens`)
      return NextResponse.json(result)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Meta Business campaigns error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
