import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('fb_access_token')?.value
    const body = await request.json()
    const { ids, status } = body

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found' },
        { status: 401 }
      )
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
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

    // Processar cada Ad individualmente para evitar rate limits
    for (const adId of ids) {
      try {
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
