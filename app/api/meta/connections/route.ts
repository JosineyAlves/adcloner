import { NextRequest, NextResponse } from 'next/server'
import { saveConnection, discoverBusinessStructure, listConnections, removeConnection } from '@/lib/meta-connections'

export const dynamic = 'force-dynamic'

/**
 * GET  -> lista as conexões (contas do Facebook) já cadastradas no AdCloner.
 * POST -> registra uma nova conexão a partir de um access_token já obtido via OAuth
 *         (o mesmo fluxo de popup que já existe em app/api/auth/callback/facebook),
 *         e dispara a descoberta de estrutura (Business Managers, contas, páginas, pixels).
 */

export async function GET() {
  try {
    const connections = await listConnections()
    return NextResponse.json({ success: true, connections })
  } catch (error) {
    console.error('Erro ao listar conexões Meta:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessToken, fbUser, tokenType, scopes } = body as {
      accessToken?: string
      fbUser?: { id: string; name?: string; email?: string }
      tokenType?: 'user' | 'system_user'
      scopes?: string[]
    }

    if (!accessToken || !fbUser?.id) {
      return NextResponse.json(
        { success: false, error: 'accessToken e fbUser.id são obrigatórios' },
        { status: 400 }
      )
    }

    const connectionId = await saveConnection({ fbUser, accessToken, tokenType, scopes })
    const discovery = await discoverBusinessStructure(connectionId, accessToken)

    return NextResponse.json({
      success: true,
      connectionId,
      ...discovery,
    })
  } catch (error) {
    console.error('Erro ao criar conexão Meta:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'Parâmetro id é obrigatório' }, { status: 400 })
    }
    await removeConnection(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao remover conexão Meta:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
