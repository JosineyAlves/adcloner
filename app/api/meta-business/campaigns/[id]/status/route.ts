import { NextRequest, NextResponse } from 'next/server'
import { resolveMetaAccessToken } from '@/lib/meta-connections'
import { getAuthenticatedUserId } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id
    const body = await request.json()
    const { status, accountId } = body
    // Resolve o token pela conexão dona da conta dessa campanha (enviado pelo cliente, que já
    // conhece o account_id de cada item) em vez de só o cookie único — ver comentário completo
    // em app/api/meta-business/campaigns/route.ts.
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
      // Atualizar status da campanha
      const response = await fetch(
        `https://graph.facebook.com/v23.0/${campaignId}`,
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
        campaignId,
        status,
        message: `Campanha ${status === 'ACTIVE' ? 'ativada' : status === 'PAUSED' ? 'pausada' : 'arquivada'} com sucesso`
      })
    } catch (error) {
      console.error('Error updating campaign status:', error)
      return NextResponse.json(
        { error: 'Failed to update campaign status' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Meta Business campaign status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
