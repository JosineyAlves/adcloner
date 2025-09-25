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
      const ads = [
        {
          id: 'mock-ad-1',
          name: 'Anúncio Teste 1',
          status: 'ACTIVE',
          adset_id: 'mock-adset-1',
          creative_id: 'mock-creative-1',
          created_time: '2024-01-15T10:00:00Z'
        },
        {
          id: 'mock-ad-2',
          name: 'Anúncio Teste 2',
          status: 'PAUSED',
          adset_id: 'mock-adset-2',
          creative_id: 'mock-creative-2',
          created_time: '2024-01-10T15:30:00Z'
        }
      ]

      return NextResponse.json({ ads })
    }

    // TODO: Implementar busca real de anúncios usando Facebook API
    // const ads = await facebookAPI.getAds(accountId, accessToken)
    
    const ads = [
      {
        id: `mock-ad-${accountId}-1`,
        name: `Anúncio ${accountId} - 1`,
        status: 'ACTIVE',
        adset_id: `mock-adset-${accountId}-1`,
        creative_id: `mock-creative-${accountId}-1`,
        created_time: '2024-01-15T10:00:00Z'
      }
    ]

    return NextResponse.json({ ads })
  } catch (error) {
    console.error('Facebook ads error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ads' },
      { status: 500 }
    )
  }
}
