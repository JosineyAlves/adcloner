import { NextRequest, NextResponse } from 'next/server'
import { listPagesForConnection } from '@/lib/meta-connections'
import { getAuthenticatedUserId } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET ?connectionId=X -> lista as Páginas do Facebook visíveis a essa conexão (Business Manager +
 * pessoais). Usa pages_show_list pra listar e pages_read_engagement pra trazer fan_count/
 * engagement de cada uma — funcionalidade real por trás dessas duas permissões pra App Review
 * (ver claude/atualizacao-portfolio-app-review-set2026.md no projeto).
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado', pages: [] }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get('connectionId')
    if (!connectionId) {
      return NextResponse.json({ success: false, error: 'connectionId é obrigatório', pages: [] }, { status: 400 })
    }
    const pages = await listPagesForConnection(connectionId, userId)
    return NextResponse.json({ success: true, pages })
  } catch (error) {
    console.error('Erro ao listar páginas:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido', pages: [] },
      { status: 500 }
    )
  }
}
