import { NextRequest, NextResponse } from 'next/server'

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

    try {
      // Buscar campanhas primeiro para obter Ad Sets
      const campaignsResponse = await fetch(
        `https://graph.facebook.com/v23.0/${accountId}/campaigns?fields=id,name&access_token=${accessToken}`
      )
      
      const campaignsData = await campaignsResponse.json()
      
      if (campaignsData.error) {
        console.error('Facebook API error:', campaignsData.error)
        return NextResponse.json(
          { error: campaignsData.error.message },
          { status: 400 }
        )
      }

      const adSets: any[] = []
      
      if (campaignsData.data) {
        // Buscar Ad Sets de cada campanha
        for (const campaign of campaignsData.data) {
          try {
            const adSetsResponse = await fetch(
              `https://graph.facebook.com/v23.0/${campaign.id}/adsets?fields=id,name,status,effective_status,daily_budget,lifetime_budget,bid_amount,targeting,created_time,updated_time&access_token=${accessToken}`
            )
            
            const adSetsData = await adSetsResponse.json()
            
            if (adSetsData.data) {
              for (const adSet of adSetsData.data) {
                try {
                  let insights = {
                    impressions: 0,
                    clicks: 0,
                    spend: 0,
                    cpc: 0,
                    ctr: 0
                  }

                  // Buscar insights do Ad Set
                  const insightsResponse = await fetch(
                    `https://graph.facebook.com/v23.0/${adSet.id}/insights?fields=impressions,clicks,spend,cpc,ctr&level=adset&date_preset=${datePreset}${since && until ? `&time_range=${JSON.stringify({since, until})}` : ''}&access_token=${accessToken}`
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

                  // Verificar se a campanha pai usa CBO
                  const campaignDetailsResponse = await fetch(
                    `https://graph.facebook.com/v23.0/${campaign.id}?fields=is_advantage_campaign_budget&access_token=${accessToken}`
                  )
                  
                  const campaignDetails = await campaignDetailsResponse.json()
                  const campaignAdvantageBudget = campaignDetails.is_advantage_campaign_budget || true // Assumir CBO por padrão

                  const metaAdSet = {
                    id: adSet.id,
                    name: adSet.name,
                    campaign_id: campaign.id,
                    campaign_name: campaign.name,
                    campaign_advantage_budget: campaignAdvantageBudget,
                    status: adSet.status,
                    effective_status: adSet.effective_status || adSet.status,
                    daily_budget: adSet.daily_budget ? parseInt(adSet.daily_budget) : undefined,
                    lifetime_budget: adSet.lifetime_budget ? parseInt(adSet.lifetime_budget) : undefined,
                    budget_type: adSet.daily_budget ? 'daily' : 'lifetime',
                    bid_amount: adSet.bid_amount ? parseFloat(adSet.bid_amount) : undefined,
                    targeting: {
                      age_min: adSet.targeting?.age_min || 18,
                      age_max: adSet.targeting?.age_max || 65,
                      geo_locations: {
                        countries: adSet.targeting?.geo_locations?.countries || ['BR']
                      },
                      interests: adSet.targeting?.interests || [],
                      genders: adSet.targeting?.genders || []
                    },
                    spend: insights.spend,
                    impressions: insights.impressions,
                    clicks: insights.clicks,
                    cpc: insights.cpc,
                    ctr: insights.ctr,
                    created_time: adSet.created_time,
                    updated_time: adSet.updated_time,
                    account_id: accountId,
                    account_name: 'Facebook Account'
                  }

                  adSets.push(metaAdSet)
                } catch (error) {
                  console.error(`Error processing ad set ${adSet.id}:`, error)
                }
              }
            }
          } catch (error) {
            console.error(`Error processing campaign ${campaign.id}:`, error)
          }
        }
      }

      return NextResponse.json({ adSets })
    } catch (error) {
      console.error('Error fetching ad sets:', error)
      return NextResponse.json(
        { error: 'Failed to fetch ad sets' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Meta Business ad sets error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
