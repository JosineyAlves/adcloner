import { NextRequest, NextResponse } from 'next/server'
import { FacebookAPI } from '@/lib/facebook-api'

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('fb_access_token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found' },
        { status: 401 }
      )
    }

    const facebookAPI = new FacebookAPI()
    
    // Por enquanto, retornar dados mockados
    // TODO: Implementar busca real de campanhas
    const campaigns = [
      {
        id: 'mock-campaign-1',
        name: 'Campanha Teste 1',
        status: 'ACTIVE',
        objective: 'OUTCOME_TRAFFIC',
        created_time: '2024-01-15T10:00:00Z'
      },
      {
        id: 'mock-campaign-2',
        name: 'Campanha Teste 2',
        status: 'PAUSED',
        objective: 'OUTCOME_CONVERSIONS',
        created_time: '2024-01-10T15:30:00Z'
      }
    ]

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Facebook campaigns error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

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

    const facebookAPI = new FacebookAPI()
    
    // TODO: Implementar criação real de campanhas
    const newCampaign = {
      id: `mock-campaign-${Date.now()}`,
      name: body.name,
      status: 'ACTIVE',
      objective: body.objective,
      created_time: new Date().toISOString()
    }

    return NextResponse.json({ campaign: newCampaign })
  } catch (error) {
    console.error('Facebook campaign creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
} 