import { NextRequest, NextResponse } from 'next/server'
import { listAdAccounts, setAdAccountSyncEnabled, setAllAdAccountsSyncEnabled } from '@/lib/meta-connections'

export const dynamic = 'force-dynamic'

/**
 * Lista todas as contas de anúncio já descobertas e salvas no Supabase,
 * de todas as conexões cadastradas — ao contrário de /api/facebook/accounts
 * (que busca ao vivo na Graph API usando só o cookie da sessão atual).
 */
export async function GET() {
  try {
    const accounts = await listAdAccounts()
    return NextResponse.json({ success: true, accounts })
  } catch (error) {
    console.error('Erro ao listar contas de anúncio:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido', accounts: [] },
      { status: 500 }
    )
  }
}

/**
 * Liga/desliga a sincronização de uma conta específica (`{ id, syncEnabled }`) ou de todas de
 * uma vez (`{ all: true, syncEnabled }`) — usado pela tela de Integrações (checkbox por conta e
 * o toggle "Ativar todas").
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, all, syncEnabled } = body

    if (typeof syncEnabled !== 'boolean') {
      return NextResponse.json({ success: false, error: 'syncEnabled é obrigatório' }, { status: 400 })
    }

    if (all) {
      await setAllAdAccountsSyncEnabled(syncEnabled)
    } else if (id) {
      await setAdAccountSyncEnabled(id, syncEnabled)
    } else {
      return NextResponse.json({ success: false, error: 'Informe id ou all' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar sincronização de conta(s):', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
