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
      // Buscar campanhas primeiro para obter Ads
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

      const ads: any[] = []
      
      if (campaignsData.data) {
        // Buscar Ads de cada campanha
        for (const campaign of campaignsData.data) {
          try {
            const adsResponse = await fetch(
              `https://graph.facebook.com/v23.0/${campaign.id}/ads?fields=id,name,status,effective_status,adset{id,name},creative{id,name,thumbnail_url,object_story_spec},created_time,updated_time&access_token=${accessToken}`
            )
            
            const adsData = await adsResponse.json()
            
            if (adsData.data) {
              for (const ad of adsData.data) {
                try {
                  let insights = {
                    impressions: 0,
                    clicks: 0,
                    spend: 0,
                    cpc: 0,
                    ctr: 0
                  }

                  // Buscar insights do Ad
                  const insightsResponse = await fetch(
                    `https://graph.facebook.com/v23.0/${ad.id}/insights?fields=impressions,clicks,spend,cpc,ctr&level=ad&date_preset=${datePreset}${since && until ? `&time_range=${JSON.stringify({since, until})}` : ''}&access_token=${accessToken}`
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

                  const metaAd = {
                    id: ad.id,
                    name: ad.name,
                    adset_id: ad.adset?.id || '',
                    adset_name: ad.adset?.name || '',
                    campaign_id: campaign.id,
                    campaign_name: campaign.name,
                    status: ad.status,
                    effective_status: ad.effective_status || ad.status,
                    creative: {
                      id: ad.creative?.id || '',
                      name: ad.creative?.name || '',
                      thumbnail_url: ad.creative?.thumbnail_url,
                      object_story_spec: ad.creative?.object_story_spec
                    },
                    spend: insights.spend,
                    impressions: insights.impressions,
                    clicks: insights.clicks,
                    cpc: insights.cpc,
                    ctr: insights.ctr,
                    created_time: ad.created_time,
                    updated_time: ad.updated_time,
                    account_id: accountId,
                    account_name: 'Facebook Account'
                  }

                  ads.push(metaAd)
                } catch (error) {
                  console.error(`Error processing ad ${ad.id}:`, error)
                }
              }
            }
          } catch (error) {
            console.error(`Error processing campaign ${campaign.id}:`, error)
          }
        }
      }

      return NextResponse.json({ ads })
    } catch (error) {
      console.error('Error fetching ads:', error)
      return NextResponse.json(
        { error: 'Failed to fetch ads' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Meta Business ads error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
