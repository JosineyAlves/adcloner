import { NextRequest, NextResponse } from 'next/server'
import { facebookRateLimiter } from '@/lib/rate-limiter'
import { cache } from '@/lib/cache'

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

    // Verificar cache primeiro
    const cacheKey = cache.generateKey('adsets', { accountId, datePreset, since, until })
    const cachedData = cache.get(cacheKey)
    
    if (cachedData) {
      console.log('📦 Retornando ad sets do cache')
      return NextResponse.json(cachedData)
    }

    try {
      // Buscar Ad Sets diretamente da conta (mais eficiente) com rate limiting
      const adSetsResponse = await facebookRateLimiter.executeWithRetry(async () => {
        return fetch(
          `https://graph.facebook.com/v23.0/${accountId}/adsets?fields=id,name,status,effective_status,daily_budget,lifetime_budget,bid_amount,targeting,created_time,updated_time,campaign{id,name}&access_token=${accessToken}`
        )
      })
      
      const adSetsData = await adSetsResponse.json()
      
      if (adSetsData.error) {
        console.error('Facebook API error:', adSetsData.error)
        return NextResponse.json(
          { error: adSetsData.error.message },
          { status: 400 }
        )
      }

      const adSets: any[] = []
      
      if (adSetsData.data) {
        // Processar cada Ad Set
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

            // Verificar se a campanha pai usa CBO (simplificado para evitar rate limit)
            let campaignAdvantageBudget = false
            try {
              // Usar apenas campos básicos para evitar erro 400
              const campaignDetailsResponse = await fetch(
                `https://graph.facebook.com/v23.0/${adSet.campaign.id}?fields=daily_budget,lifetime_budget&access_token=${accessToken}`
              )
              
              const campaignDetails = await campaignDetailsResponse.json()
              
              if (campaignDetails.error) {
                console.warn(`Error fetching campaign details for ${adSet.campaign.id}:`, campaignDetails.error)
                // Se houver erro, assumir ABO (mais seguro)
                campaignAdvantageBudget = false
              } else {
                // Verificar se tem orçamento na campanha
                campaignAdvantageBudget = !!(campaignDetails.daily_budget || campaignDetails.lifetime_budget)
              }
            } catch (error) {
              console.warn(`Error fetching campaign details for ${adSet.campaign.id}:`, error)
              // Em caso de erro, assumir ABO (mais seguro)
              campaignAdvantageBudget = false
            }

            const metaAdSet = {
              id: adSet.id,
              name: adSet.name,
              campaign_id: adSet.campaign.id,
              campaign_name: adSet.campaign.name,
              campaign_advantage_budget: campaignAdvantageBudget,
              status: adSet.status,
              effective_status: adSet.effective_status || adSet.status,
              daily_budget: adSet.daily_budget ? Math.round(parseInt(adSet.daily_budget) / 100) : undefined,
              lifetime_budget: adSet.lifetime_budget ? Math.round(parseInt(adSet.lifetime_budget) / 100) : undefined,
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

      const result = { adSets }
      
      // Salvar no cache por 2 minutos
      cache.set(cacheKey, result, 2 * 60 * 1000)
      
      return NextResponse.json(result)
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
