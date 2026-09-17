import { NextRequest, NextResponse } from 'next/server'
import { resolveMetaAccessToken } from '@/lib/meta-connections'
import { getAuthenticatedUserId } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adId = params.id
    const body = await request.json()
    const { status, accountId } = body
    // Ver comentário completo em app/api/meta-business/campaigns/[id]/status/route.ts.
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    const accessToken = await resolveMetaAccessToken(request.cookies.get('fb_access_token')?.value, accountId, userId)

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found' },
        { status: 401 }
      )
    }

    if (!status || !['ACTIVE', 'PAUSED', 'ARCHIVED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be ACTIVE, PAUSED, or ARCHIVED' },
        { status: 400 }
      )
    }

    try {
      // Atualizar status do Ad
      const response = await fetch(
        `https://graph.facebook.com/v23.0/${adId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            status: status,
            access_token: accessToken
          })
        }
      )
      
      const data = await response.json()
      
      if (data.error) {
        console.error('Facebook API error:', data.error)
        return NextResponse.json(
          { error: data.error.message },
          { status: 400 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        adId,
        status,
        message: `Anúncio ${status === 'ACTIVE' ? 'ativado' : status === 'PAUSED' ? 'pausado' : 'arquivado'} com sucesso`
      })
    } catch (error) {
      console.error('Error updating ad status:', error)
      return NextResponse.json(
        { error: 'Failed to update ad status' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Meta Business ad status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
