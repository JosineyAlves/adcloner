import { NextRequest, NextResponse } from 'next/server'
import { getColumnPreferences, saveColumnPreferences } from '@/lib/column-preferences'

export const dynamic = 'force-dynamic'

// Identidade do usuário nesta app é sempre o fb_user_id (cookie setado no login com o Facebook —
// ver app/api/auth/check/route.ts). Não existe tabela de usuários própria.
function getFbUserId(request: NextRequest): string | null {
  return request.cookies.get('fb_user_id')?.value ?? null
}

export async function GET(request: NextRequest) {
  try {
    const fbUserId = getFbUserId(request)
    if (!fbUserId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const viewKey = request.nextUrl.searchParams.get('viewKey')
    if (!viewKey) {
      return NextResponse.json({ error: 'viewKey é obrigatório' }, { status: 400 })
    }

    const metricIds = await getColumnPreferences(fbUserId, viewKey)
    return NextResponse.json({ metricIds })
  } catch (error: any) {
    console.error('Erro ao buscar preferências de colunas:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const fbUserId = getFbUserId(request)
    if (!fbUserId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { viewKey, metricIds } = body ?? {}

    if (!viewKey || typeof viewKey !== 'string') {
      return NextResponse.json({ error: 'viewKey é obrigatório' }, { status: 400 })
    }
    if (!Array.isArray(metricIds) || !metricIds.every((id) => typeof id === 'string')) {
      return NextResponse.json({ error: 'metricIds deve ser uma lista de strings' }, { status: 400 })
    }

    await saveColumnPreferences(fbUserId, viewKey, metricIds)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao salvar preferências de colunas:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}
