import { NextRequest, NextResponse } from 'next/server'
import { resolveMetaAccessToken } from '@/lib/meta-connections'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, items, status } = body
    // Aceita `items: [{id, accountId}]` (novo formato — permite resolver o token certo por item,
    // já que campanhas selecionadas em lote podem pertencer a contas/conexões diferentes) e
    // mantém `ids: string[]` (formato antigo) por compatibilidade, caindo pro cookie único nesse
    // caso. Ver comentário completo em app/api/meta-business/campaigns/[id]/status/route.ts.
    const targets: { id: string; accountId?: string }[] = Array.isArray(items)
      ? items
      : Array.isArray(ids) ? ids.map((id: string) => ({ id })) : []
    const cookieToken = request.cookies.get('fb_access_token')?.value

    if (targets.length === 0) {
      return NextResponse.json(
        { error: 'IDs array is required' },
        { status: 400 }
      )
    }

    if (!status || !['ACTIVE', 'PAUSED', 'ARCHIVED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be ACTIVE, PAUSED, or ARCHIVED' },
        { status: 400 }
      )
    }

    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[]
    }

    const tokenCache = new Map<string, string | null>()
    const resolveToken = async (accountId?: string): Promise<string | null> => {
      if (!accountId) return cookieToken ?? null
      if (tokenCache.has(accountId)) return tokenCache.get(accountId) ?? null
      const token = await resolveMetaAccessToken(cookieToken, accountId)
      tokenCache.set(accountId, token)
      return token
    }

    // Processar cada campanha individualmente para evitar rate limits
    for (const { id: campaignId, accountId } of targets) {
      try {
        const accessToken = await resolveToken(accountId)
        if (!accessToken) {
          results.failed.push({ id: campaignId, error: 'Access token not found' })
          continue
        }

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
          console.error(`Facebook API error for campaign ${campaignId}:`, data.error)
          results.failed.push({
            id: campaignId,
            error: data.error.message
          })
        } else {
          results.successful.push(campaignId)
        }
      } catch (error) {
        console.error(`Error updating campaign ${campaignId}:`, error)
        results.failed.push({
          id: campaignId,
          error: 'Network error'
        })
      }

      // Pequena pausa entre requisições para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return NextResponse.json({
      success: true,
      results,
      message: `${results.successful.length} campanhas processadas com sucesso, ${results.failed.length} falharam`
    })
  } catch (error) {
    console.error('Meta Business bulk campaign status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
