import { NextRequest, NextResponse } from 'next/server'
import { resolveMetaAccessToken } from '@/lib/meta-connections'
import { getAuthenticatedUserId } from '@/lib/supabase/server'
import { BID_AMOUNT_STRATEGIES } from '@/lib/bid-strategies'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adSetId = params.id
    const body = await request.json()
    const { bidAmount, bidStrategy, accountId } = body
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

    if (bidStrategy && !BID_AMOUNT_STRATEGIES.has(bidStrategy)) {
      return NextResponse.json(
        {
          error: 'Este conjunto usa uma estratégia de lance sem limite editável (lance automático ou ROAS mínimo).',
          code: 'BID_STRATEGY_NOT_EDITABLE'
        },
        { status: 400 }
      )
    }

    // Validar se o limite de lance é válido (mínimo $0.01, mesmo piso usado no orçamento)
    if (!bidAmount || bidAmount < 0.01) {
      return NextResponse.json(
        { error: 'Limite de lance deve ser pelo menos $0,01' },
        { status: 400 }
      )
    }

    try {
      // bid_amount é enviado em centavos, igual daily_budget/lifetime_budget — ver
      // app/api/meta-business/adsets/[id]/budget/route.ts.
      const formData = new URLSearchParams()
      formData.append('access_token', accessToken)
      formData.append('bid_amount', Math.round(bidAmount * 100).toString())

      console.log('📤 Enviando para Facebook API (AdSet bid):', {
        adSetId,
        bidAmount,
        bid_amount_centavos: Math.round(bidAmount * 100)
      })

      const response = await fetch(
        `https://graph.facebook.com/v23.0/${adSetId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData
        }
      )

      // Mesmo motivo do route.ts de orçamento: o corpo de erro da Graph API só vem se o parse
      // acontecer antes de checar response.ok.
      const responseText = await response.text()
      console.log('📥 Resposta da Facebook API (AdSet bid):', responseText)

      if (!responseText) {
        console.error('Facebook API returned empty response, status:', response.status, response.statusText)
        return NextResponse.json({
          error: response.ok
            ? 'Resposta vazia da API do Facebook'
            : `Erro na API do Facebook: ${response.status} ${response.statusText}`,
          code: response.ok ? 'EMPTY_RESPONSE' : 'FACEBOOK_API_ERROR'
        }, { status: response.ok ? 500 : response.status })
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse Facebook API response:', parseError)
        console.error('Response text:', responseText)
        return NextResponse.json({
          error: response.ok
            ? 'Resposta inválida da API do Facebook'
            : `Erro na API do Facebook: ${response.status} ${response.statusText}`,
          code: response.ok ? 'INVALID_JSON_RESPONSE' : 'FACEBOOK_API_ERROR'
        }, { status: response.ok ? 500 : response.status })
      }

      if (data.error) {
        console.error('Facebook API error:', data.error)

        if (data.error.code === 4 || data.error.code === 17 || data.error.code === 341) {
          return NextResponse.json(
            {
              error: 'Limite de alterações atingido. Tente novamente em alguns minutos.',
              code: 'RATE_LIMIT'
            },
            { status: 429 }
          )
        }

        if (data.error.code === 100) {
          return NextResponse.json(
            {
              error: 'Limite de lance inválido para a estratégia deste conjunto. Verifique o valor e tente novamente.',
              code: 'INVALID_BID'
            },
            { status: 400 }
          )
        }

        return NextResponse.json(
          {
            error: `Erro ao atualizar limite de lance: ${data.error.error_user_msg || data.error.message}`,
            code: 'UPDATE_ERROR'
          },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        adSetId,
        bidAmount,
        message: `Limite de lance do conjunto atualizado para $${bidAmount.toFixed(2)}`
      })
    } catch (error) {
      console.error('Error updating ad set bid:', error)
      return NextResponse.json(
        { error: 'Failed to update ad set bid' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Meta Business ad set bid error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
