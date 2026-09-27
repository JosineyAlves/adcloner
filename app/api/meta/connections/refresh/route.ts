import { NextRequest, NextResponse } from 'next/server'
import { refreshConnection, refreshAllConnections } from '@/lib/meta-connections'
import { getAuthenticatedUserId } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * POST -> reexecuta a descoberta de estrutura (Business Managers/contas) para uma conexão
 * específica (`{ id }`) ou para todas as conexões do usuário (sem `id`) — usado pelo botão
 * "Atualizar" na tela de Integrações, pra repuxar account_status (Ativa/Restrita) de cada conta e
 * detectar perfis que desconectaram/tiveram o token expirado desde a última sincronização.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { id } = body as { id?: string }

    const results = id ? [await refreshConnection(id, userId)] : await refreshAllConnections(userId)

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Erro ao atualizar conexões Meta:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
