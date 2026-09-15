import { NextRequest, NextResponse } from 'next/server'
import { syncAllDueAccounts, listRecentSyncRuns } from '@/lib/meta-sync'

export const dynamic = 'force-dynamic'
// Dá mais fôlego que o padrão de 10s do plano Hobby para o loop de contas (o Hobby
// permite até 60s de execução em Route Handlers). Ajuste se o plano mudar.
export const maxDuration = 60

/**
 * POST -> dispara uma sincronização (chamado pelo Vercel Cron 1x/dia, ou manualmente
 * pelo botão "Sincronizar agora" na UI). Protegido por CRON_SECRET quando a chamada
 * vem do cron (ver vercel.json); chamadas manuais da própria UI não precisam do header.
 * GET  -> lista as últimas execuções, para exibir o histórico na UI.
 */

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const isCronCall = authHeader !== null
    if (isCronCall && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const results = await syncAllDueAccounts(5)
    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Erro na sincronização Meta:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const runs = await listRecentSyncRuns(20)
    return NextResponse.json({ success: true, runs })
  } catch (error) {
    console.error('Erro ao listar execuções de sincronização:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido', runs: [] },
      { status: 500 }
    )
  }
}
