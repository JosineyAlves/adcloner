import { NextRequest, NextResponse } from 'next/server'
import { getColumnPreferences, saveColumnPreferences } from '@/lib/column-preferences'
import { getAuthenticatedUserId } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Identidade do usuário: sessão do vmetrics (Supabase Auth), igual todas as outras rotas de
// meta-business/* e lib/meta-connections.ts — ver lib/supabase/server.ts. Antes esta rota lia um
// cookie fb_user_id que nunca era setado em nenhum fluxo real do app (login com o Facebook só
// seta fb_access_token), então toda chamada aqui retornava 401 silenciosamente e a preferência
// nunca chegava a ser salva no Supabase, só no cache local do navegador.

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const viewKey = request.nextUrl.searchParams.get('viewKey')
    if (!viewKey) {
      return NextResponse.json({ error: 'viewKey é obrigatório' }, { status: 400 })
    }

    const metricIds = await getColumnPreferences(userId, viewKey)
    return NextResponse.json({ metricIds })
  } catch (error: any) {
    console.error('Erro ao buscar preferências de colunas:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
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

    await saveColumnPreferences(userId, viewKey, metricIds)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao salvar preferências de colunas:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}
