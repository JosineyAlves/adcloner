import { NextRequest, NextResponse } from 'next/server'
import { FacebookAPI } from '@/lib/facebook-api'

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('fb_access_token')?.value
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found' },
        { status: 401 }
      )
    }

    const facebookAPI = new FacebookAPI()
    
    // Se não especificou accountId, buscar de todas as contas
    if (!accountId) {
      // Por enquanto, retornar dados mockados
      const adsets = [
        {
          id: 'mock-adset-1',
          name: 'Conjunto Teste 1',
          status: 'ACTIVE',
          campaign_id: 'mock-campaign-1',
          daily_budget: 100,
          created_time: '2024-01-15T10:00:00Z'
        },
        {
          id: 'mock-adset-2',
          name: 'Conjunto Teste 2',
          status: 'PAUSED',
          campaign_id: 'mock-campaign-2',
          daily_budget: 200,
          created_time: '2024-01-10T15:30:00Z'
        }
      ]

      return NextResponse.json({ adsets })
    }

    // TODO: Implementar busca real de ad sets usando Facebook API
    // const adsets = await facebookAPI.getAdSets(accountId, accessToken)
    
    const adsets = [
      {
        id: `mock-adset-${accountId}-1`,
        name: `Conjunto ${accountId} - 1`,
        status: 'ACTIVE',
        campaign_id: `mock-campaign-${accountId}-1`,
        daily_budget: 150,
        created_time: '2024-01-15T10:00:00Z'
      }
    ]

    return NextResponse.json({ adsets })
  } catch (error) {
    console.error('Facebook adsets error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ad sets' },
      { status: 500 }
    )
  }
}
