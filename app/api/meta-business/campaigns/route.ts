import { NextRequest, NextResponse } from 'next/server'
import { FacebookAPI } from '@/lib/facebook-api'
import { MetaCampaign } from '@/lib/types'

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
    
    try {
      // Buscar campanhas da conta
      const campaignsResponse = await fetch(
        `https://graph.facebook.com/v23.0/${accountId}/campaigns?fields=id,name,objective,status,effective_status,daily_budget,lifetime_budget,created_time,updated_time&access_token=${accessToken}`
      )
      
      const campaignsData = await campaignsResponse.json()
      
      if (campaignsData.error) {
        console.error('Facebook API error:', campaignsData.error)
        return NextResponse.json(
          { error: campaignsData.error.message },
          { status: 400 }
        )
      }

      const campaigns: MetaCampaign[] = []
      
      if (campaignsData.data) {
        // Buscar insights para cada campanha
        for (const campaign of campaignsData.data) {
          try {
            let insights = {
              impressions: 0,
              clicks: 0,
              spend: 0,
              cpc: 0,
              ctr: 0
            }

            // Buscar insights da campanha
            const insightsResponse = await fetch(
              `https://graph.facebook.com/v23.0/${campaign.id}/insights?fields=impressions,clicks,spend,cpc,ctr&level=campaign&date_preset=${datePreset}${since && until ? `&time_range=${JSON.stringify({since, until})}` : ''}&access_token=${accessToken}`
            )
            
            const insightsData = await insightsResponse.json()
            
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

            // Verificar se tem Advantage Campaign Budget
            let advantageCampaignBudget = false
            
            try {
              const campaignDetailsResponse = await fetch(
                `https://graph.facebook.com/v23.0/${campaign.id}?fields=is_advantage_campaign_budget,daily_budget,lifetime_budget&access_token=${accessToken}`
              )
              
              const campaignDetails = await campaignDetailsResponse.json()
              
              if (campaignDetails.error) {
                console.warn(`Error fetching campaign details for ${campaign.id}:`, campaignDetails.error)
                // Se houver erro, verificar se tem orçamento definido
                advantageCampaignBudget = !!(campaign.daily_budget || campaign.lifetime_budget)
              } else {
                // Verificar se o campo existe e é true
                if (campaignDetails.is_advantage_campaign_budget !== undefined) {
                  advantageCampaignBudget = campaignDetails.is_advantage_campaign_budget === true
                } else {
                  // Se o campo não estiver disponível, verificar se tem orçamento
                  advantageCampaignBudget = !!(campaignDetails.daily_budget || campaignDetails.lifetime_budget || campaign.daily_budget || campaign.lifetime_budget)
                }
              }
            } catch (error) {
              console.warn(`Error fetching campaign details for ${campaign.id}:`, error)
              // Em caso de erro, assumir CBO se tem orçamento
              advantageCampaignBudget = !!(campaign.daily_budget || campaign.lifetime_budget)
            }

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

      return NextResponse.json({ campaigns })
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
