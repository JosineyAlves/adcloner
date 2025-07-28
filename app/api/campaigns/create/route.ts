import { NextRequest, NextResponse } from 'next/server'
import { FacebookAPI } from '@/lib/facebook-api'

const facebookAPI = new FacebookAPI()

export async function POST(request: NextRequest) {
  try {
    const { name, objective, dailyBudget, targetAccountId, targeting, creative } = await request.json()
    const accessToken = request.cookies.get('fb_access_token')?.value
    
    if (!accessToken) {
      return NextResponse.json({ 
        success: false,
        message: 'Nenhuma conta conectada. Conecte sua conta do Facebook primeiro.'
      }, { status: 401 })
    }

    console.log(`🚀 Criando nova campanha: ${name}`)

    // 1. Criar campanha
    const campaignId = await facebookAPI.createCampaign(targetAccountId, accessToken, {
      name: name,
      objective: objective,
      status: 'PAUSED',
      special_ad_categories: '[]',
      daily_budget: dailyBudget
    })

    console.log(`✅ Campanha criada: ${campaignId}`)

    // 2. Criar Ad Set
    const adSetId = await facebookAPI.createAdSet(targetAccountId, accessToken, {
      name: `${name} - Ad Set`,
      campaignId: campaignId,
      targeting: {
        geo_locations: {
          countries: targeting.countries
        },
        age_min: targeting.ageMin,
        age_max: targeting.ageMax
      },
      dailyBudget: dailyBudget,
      optimizationGoal: objective === 'OUTCOME_SALES' ? 'OFFSITE_CONVERSIONS' : 'LINK_CLICKS'
    })

    console.log(`✅ Ad Set criado: ${adSetId}`)

    // 3. Criar Creative
    const creativeId = await facebookAPI.createCreative(targetAccountId, {
      name: `${name} - Creative`,
      object_story_spec: {
        page_id: '656352377561426', // Página padrão (será melhorado)
        link_data: {
          link: creative.link,
          message: creative.message,
          title: creative.title
        }
      }
    }, accessToken)

    console.log(`✅ Creative criado: ${creativeId}`)

    // 4. Criar Ad
    const adId = await facebookAPI.createAd(targetAccountId, accessToken, {
      name: `${name} - Ad`,
      adSetId: adSetId,
      creativeId: creativeId
    })

    console.log(`✅ Ad criado: ${adId}`)

    return NextResponse.json({ 
      success: true,
      campaign: {
        id: campaignId,
        name: name,
        objective: objective,
        status: 'PAUSED'
      }
    })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
} 