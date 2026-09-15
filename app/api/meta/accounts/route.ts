import { NextResponse } from 'next/server'
import { listAdAccounts } from '@/lib/meta-connections'

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
