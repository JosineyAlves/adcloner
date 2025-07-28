import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { FacebookAPI } from '@/lib/facebook-api'

const facebookAPI = new FacebookAPI()

export async function POST(request: NextRequest) {
  try {
    const { csvData, accountConfig } = await request.json()
    
    // Obter access token dos cookies
    const cookieStore = cookies()
    const accessToken = cookieStore.get('fb_access_token')?.value
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Token de acesso não encontrado' },
        { status: 401 }
      )
    }

    console.log(`🚀 Iniciando clonagem CSV para conta: ${accountConfig.accountName}`)
    console.log(`📊 Dados CSV: ${csvData.length} linhas`)

    // Processar dados CSV e criar campanhas
    const result = await processCSVAndCreateCampaigns(
      csvData, 
      accountConfig, 
      accessToken
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error cloning campaign via CSV:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function processCSVAndCreateCampaigns(
  csvData: any[], 
  accountConfig: any, 
  accessToken: string
) {
  try {
    // Agrupar dados por campanha
    const campaigns = groupByCampaign(csvData)
    
    const results = []
    
    for (const campaign of campaigns) {
      console.log(`📋 Processando campanha: ${campaign.name}`)
      
      // Criar campanha
      const campaignData = {
        name: campaign.name,
        objective: campaign.objective || 'OUTCOME_SALES',
        status: 'PAUSED',
        special_ad_categories: '[]',
        daily_budget: campaign.dailyBudget || 1000
      }
      
      const campaignId = await facebookAPI.createCampaign(
        accountConfig.accountId,
        accessToken,
        campaignData
      )
      
      console.log(`✅ Campanha criada: ${campaignId}`)
      
      // Criar Ad Sets
      for (const adSet of campaign.adSets) {
        console.log(`📋 Processando Ad Set: ${adSet.name}`)
        
        const adSetData = {
          name: adSet.name,
          campaign_id: campaignId,
          status: 'PAUSED',
          daily_budget: adSet.dailyBudget || 1000,
          billing_event: 'IMPRESSIONS',
          optimization_goal: adSet.optimizationGoal || 'REACH',
          targeting: {
            geo_locations: { countries: ['BR'] },
            age_min: 18,
            age_max: 65
          },
          bid_amount: '1000'
        }
        
        const adSetId = await facebookAPI.createAdSet(
          accountConfig.accountId,
          accessToken,
          adSetData
        )
        
        console.log(`✅ Ad Set criado: ${adSetId}`)
        
        // Criar Anúncios
        for (const ad of adSet.ads) {
          console.log(`📋 Processando anúncio: ${ad.name}`)
          
          // Criar creative
          const creativeData = {
            name: `Creative for ${ad.name}`,
            object_story_spec: {
              page_id: accountConfig.pageId || '656352377561426', // Página padrão
              link_data: {
                title: ad.title || 'Título do Anúncio',
                message: ad.body || 'Descrição do anúncio',
                link: accountConfig.customUrl || ad.link || 'https://example.com',
                image_hash: ad.imageHash || null
              }
            }
          }
          
          const creativeId = await facebookAPI.createCreative(
            accountConfig.accountId,
            creativeData,
            accessToken
          )
          
          console.log(`✅ Creative criado: ${creativeId}`)
          
          // Criar anúncio
          const adData = {
            name: ad.name,
            adset_id: adSetId,
            creative: { creative_id: creativeId },
            status: 'PAUSED'
          }
          
          const adId = await facebookAPI.createAd(
            accountConfig.accountId,
            accessToken,
            adData
          )
          
          console.log(`✅ Anúncio criado: ${adId}`)
        }
      }
      
      results.push({
        campaignId,
        name: campaign.name,
        adSetsCount: campaign.adSets.length,
        adsCount: campaign.adSets.reduce((total: number, adSet: any) => total + adSet.ads.length, 0)
      })
    }
    
    return {
      success: true,
      results,
      accountName: accountConfig.accountName
    }
    
  } catch (error) {
    console.error('Error processing CSV:', error)
    throw error
  }
}

function groupByCampaign(csvData: any[]) {
  const campaigns: any = {}
  
  for (const row of csvData) {
    const campaignName = row['Campaign Name'] || 'Campanha Padrão'
    const adSetName = row['Ad Set Name'] || 'Ad Set Padrão'
    const adName = row['Ad Name'] || 'Anúncio Padrão'
    
    if (!campaigns[campaignName]) {
      campaigns[campaignName] = {
        name: campaignName,
        objective: row['Campaign Objective'] || 'OUTCOME_SALES',
        dailyBudget: parseInt(row['Campaign Daily Budget']) || 1000,
        adSets: {}
      }
    }
    
    if (!campaigns[campaignName].adSets[adSetName]) {
      campaigns[campaignName].adSets[adSetName] = {
        name: adSetName,
        dailyBudget: parseInt(row['Ad Set Daily Budget']) || 1000,
        optimizationGoal: row['Optimization Goal'] || 'REACH',
        ads: []
      }
    }
    
    campaigns[campaignName].adSets[adSetName].ads.push({
      name: adName,
      title: row['Title'] || 'Título do Anúncio',
      body: row['Body'] || 'Descrição do anúncio',
      link: row['Link'] || 'https://example.com',
      imageHash: row['Image Hash'] || null
    })
  }
  
  // Converter para array
  return Object.values(campaigns).map((campaign: any) => ({
    ...campaign,
    adSets: Object.values(campaign.adSets)
  }))
} 