import { NextRequest, NextResponse } from 'next/server'
import { resolveMetaAccessToken } from '@/lib/meta-connections'
import { getAuthenticatedUserId } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, items, status } = body
    // Ver comentário completo em app/api/meta-business/campaigns/bulk-status/route.ts.
    const targets: { id: string; accountId?: string }[] = Array.isArray(items)
      ? items
      : Array.isArray(ids) ? ids.map((id: string) => ({ id })) : []
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
      const token = await resolveMetaAccessToken(cookieToken, accountId, userId)
      tokenCache.set(accountId, token)
      return token
    }

    // Processar cada Ad individualmente para evitar rate limits
    for (const { id: adId, accountId } of targets) {
      try {
        const accessToken = await resolveToken(accountId)
        if (!accessToken) {
          results.failed.push({ id: adId, error: 'Access token not found' })
          continue
        }

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
          console.error(`Facebook API error for ad ${adId}:`, data.error)
          results.failed.push({
            id: adId,
            error: data.error.message
          })
        } else {
          results.successful.push(adId)
        }
      } catch (error) {
        console.error(`Error updating ad ${adId}:`, error)
        results.failed.push({
          id: adId,
          error: 'Network error'
        })
      }

      // Pequena pausa entre requisições para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return NextResponse.json({
      success: true,
      results,
      message: `${results.successful.length} anúncios processados com sucesso, ${results.failed.length} falharam`
    })
  } catch (error) {
    console.error('Meta Business bulk ad status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
