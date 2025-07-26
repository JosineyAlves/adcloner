import { NextRequest, NextResponse } from 'next/server'
import { FacebookAPI } from '@/lib/facebook-api'

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('fb_access_token')?.value
    const body = await request.json()

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found' },
        { status: 401 }
      )
    }

    const { sourceAccountId, targetAccountId, campaignId } = body

    if (!sourceAccountId || !targetAccountId || !campaignId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const facebookAPI = new FacebookAPI()
    
    // TODO: Implementar clonagem real de campanhas
    const clonedCampaign = {
      id: `cloned-campaign-${Date.now()}`,
      name: `Clone - ${campaignId}`,
      status: 'ACTIVE',
      source_campaign_id: campaignId,
      source_account_id: sourceAccountId,
      target_account_id: targetAccountId,
      created_time: new Date().toISOString()
    }

    return NextResponse.json({ 
      success: true, 
      clonedCampaign 
    })
  } catch (error) {
    console.error('Facebook clone error:', error)
    return NextResponse.json(
      { error: 'Failed to clone campaign' },
      { status: 500 }
    )
  }
} 