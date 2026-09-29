import { NextRequest, NextResponse } from 'next/server'
import { resolveMetaAccessToken } from '@/lib/meta-connections'
import { getAuthenticatedUserId } from '@/lib/supabase/server'
import { BID_AMOUNT_STRATEGIES } from '@/lib/bid-strategies'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, bidAmount } = body
    // items: { id, accountId?, bidStrategy? }[] — mesmo formato de campaigns/adsets `bulk-status`.
    // bidStrategy vem do frontend (já carregado na tabela) pra decidir aqui, por item, se dá pra
    // aplicar o mesmo valor sem gastar uma chamada à Graph API em conjuntos que não aceitam.
    const targets: { id: string; accountId?: string; bidStrategy?: string }[] = Array.isArray(items) ? items : []
    const cookieToken = request.cookies.get('fb_access_token')?.value

    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (targets.length === 0) {
      return NextResponse.json(
        { error: 'IDs array is required' },
        { status: 400 }
      )
    }

    // Mesmo piso usado no endpoint individual (adsets/[id]/bid/route.ts).
    if (!bidAmount || bidAmount < 0.01) {
      return NextResponse.json(
        { error: 'Limite de lance deve ser pelo menos $0,01' },
        { status: 400 }
      )
    }

    const results = {
      successful: [] as string[],
      skipped: [] as { id: string; reason: string }[],
      failed: [] as { id: string; error: string }[]
    }

    const tokenCache = new Map<string, string | null>()
    const resolveToken = async (accountId?: string): Promise<string | null> => {
      if (!accountId) return cookieToken ?? null
      if (tokenCache.has(accountId)) return tokenCache.get(accountId) ?? null
      const token = await resolveMetaAccessToken(cookieToken, accountId, userId)
      tokenCache.set(accountId, token)
      return token
    }

    // Processar cada Ad Set individualmente (Batch API da Meta reduziria round-trips, mas cada
    // escrita ainda consome o mesmo limite de rate por conta — o ganho real é só de latência, e o
    // padrão sequencial com pausa abaixo já é o mesmo usado em bulk-status pra esse fim). O valor
    // de bid_amount é o MESMO para todos os itens — é isso que torna essa rota "em massa": aplicar
    // um único valor a N conjuntos de uma vez, não valores diferentes por item.
    for (const { id: adSetId, accountId, bidStrategy } of targets) {
      // Pular direto os que usam estratégia sem limite editável (lance automático ou ROAS mínimo)
      // — mesma checagem do endpoint individual, sem gastar chamada à API pra eles.
      if (bidStrategy && !BID_AMOUNT_STRATEGIES.has(bidStrategy)) {
        results.skipped.push({ id: adSetId, reason: 'Estratégia de lance sem limite editável' })
        continue
      }

      try {
        const accessToken = await resolveToken(accountId)
        if (!accessToken) {
          results.failed.push({ id: adSetId, error: 'Access token not found' })
          continue
        }

        // bid_amount é enviado em centavos, igual no endpoint individual.
        const response = await fetch(
          `https://graph.facebook.com/v23.0/${adSetId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              bid_amount: Math.round(bidAmount * 100).toString(),
              access_token: accessToken
            })
          }
        )

        const data = await response.json()

        if (data.error) {
          console.error(`Facebook API error for ad set ${adSetId}:`, data.error)
          results.failed.push({
            id: adSetId,
            error: data.error.error_user_msg || data.error.message
          })
        } else {
          results.successful.push(adSetId)
        }
      } catch (error) {
        console.error(`Error updating bid for ad set ${adSetId}:`, error)
        results.failed.push({
          id: adSetId,
          error: 'Network error'
        })
      }

      // Pequena pausa entre requisições para evitar rate limit — mesmo valor do bulk-status.
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return NextResponse.json({
      success: true,
      results,
      bidAmount,
      message: `${results.successful.length} conjunto(s) atualizados, ${results.skipped.length} ignorado(s) (lance automático/ROAS), ${results.failed.length} falharam`
    })
  } catch (error) {
    console.error('Meta Business bulk ad set bid error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
