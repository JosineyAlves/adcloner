import { NextRequest, NextResponse } from 'next/server'
import { listAdAccounts, setAdAccountSyncEnabled, setAllAdAccountsSyncEnabled } from '@/lib/meta-connections'
import { getAuthenticatedUserId } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Lista todas as contas de anúncio já descobertas e salvas no Supabase,
 * de todas as conexões cadastradas — ao contrário de /api/facebook/accounts
 * (que busca ao vivo na Graph API usando só o cookie da sessão atual).
 *
 * `?enabledOnly=true` filtra pra só as contas com sync_enabled=true — usado pelo AppContext
 * (Meta Business/Dashboard), pra que uma conta desabilitada em Integrações pare de ser buscada/
 * contabilizada nessas telas. A tela de Integrações chama sem esse parâmetro, pois precisa
 * listar e reativar contas desabilitadas.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado', accounts: [] }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const enabledOnly = searchParams.get('enabledOnly') === 'true'
    const accounts = await listAdAccounts(userId, { enabledOnly })
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
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, all, syncEnabled } = body

    if (typeof syncEnabled !== 'boolean') {
      return NextResponse.json({ success: false, error: 'syncEnabled é obrigatório' }, { status: 400 })
    }

    if (all) {
      await setAllAdAccountsSyncEnabled(syncEnabled, userId)
    } else if (id) {
      await setAdAccountSyncEnabled(id, syncEnabled, userId)
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
