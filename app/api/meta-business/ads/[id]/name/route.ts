import { NextRequest, NextResponse } from 'next/server'
import { resolveMetaAccessToken } from '@/lib/meta-connections'
import { getAuthenticatedUserId } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const MAX_NAME_LENGTH = 400

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, accountId } = await request.json()
    const adId = params.id
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    const accessToken = await resolveMetaAccessToken(request.cookies.get('fb_access_token')?.value, accountId, userId)

    if (!accessToken) {
      return NextResponse.json({
        error: 'Token de acesso não encontrado'
      }, { status: 401 })
    }

    const trimmedName = typeof name === 'string' ? name.trim() : ''

    if (!trimmedName) {
      return NextResponse.json({
        error: 'Nome inválido. O nome não pode ficar vazio.',
        code: 'INVALID_NAME'
      }, { status: 400 })
    }

    if (trimmedName.length > MAX_NAME_LENGTH) {
      return NextResponse.json({
        error: `Nome muito longo (máximo ${MAX_NAME_LENGTH} caracteres).`,
        code: 'INVALID_NAME'
      }, { status: 400 })
    }

    console.log(`🔄 Atualizando nome do anúncio ${adId}:`, { name: trimmedName })

    const formData = new URLSearchParams()
    formData.append('access_token', accessToken)
    formData.append('name', trimmedName)

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${adId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      }
    )

    const responseText = await response.text()
    console.log('📥 Resposta da Facebook API:', responseText)

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

      if (data.error.code === 4 || data.error.code === 17 || data.error.code === 341 || data.error.code === 613) {
        return NextResponse.json({
          error: 'Limite de taxa excedido. Tente novamente em alguns minutos.',
          code: 'RATE_LIMIT_EXCEEDED'
        }, { status: 429 })
      }

      return NextResponse.json({
        error: data.error.error_user_msg || data.error.message || 'Erro ao atualizar nome',
        code: data.error.code || 'UNKNOWN_ERROR'
      }, { status: 400 })
    }

    console.log(`✅ Nome do anúncio ${adId} atualizado com sucesso`)

    return NextResponse.json({
      success: true,
      message: 'Nome atualizado com sucesso',
      name: trimmedName
    })

  } catch (error) {
    console.error('Error updating ad name:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}
