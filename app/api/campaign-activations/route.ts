import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/supabase/server'
import {
  isActivationUser, listActivations, listRuns, upsertActivations, setActivationEnabled, deleteActivation,
  validateInput, ActivationInput
} from '@/lib/campaign-activations'

export const dynamic = 'force-dynamic'

// Recurso restrito: quem não está em ACTIVATION_SCHEDULE_EMAILS recebe { allowed: false } no GET
// (o botão some da tela) e 403 nas demais rotas.
async function authorize() {
  const userId = await getAuthenticatedUserId()
  if (!userId) return { userId: null, allowed: false }
  return { userId, allowed: await isActivationUser(userId) }
}

export async function GET() {
  const { userId, allowed } = await authorize()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!allowed) return NextResponse.json({ allowed: false, activations: [] })
  try {
    const [activations, history] = await Promise.all([listActivations(userId), listRuns(userId)])
    return NextResponse.json({ allowed: true, activations, history })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { userId, allowed } = await authorize()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!allowed) return NextResponse.json({ error: 'Recurso não liberado' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const items: ActivationInput[] = Array.isArray(body?.activations) ? body.activations : []
  if (items.length === 0) return NextResponse.json({ error: 'Nenhuma campanha informada' }, { status: 400 })
  if (items.length > 100) return NextResponse.json({ error: 'Máximo de 100 campanhas por vez' }, { status: 400 })
  for (const item of items) {
    const invalid = validateInput(item)
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })
  }
  try {
    await upsertActivations(userId, items)
    return NextResponse.json({ activations: await listActivations(userId) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

// PATCH { id, enabled } liga/desliga um agendamento.
export async function PATCH(request: NextRequest) {
  const { userId, allowed } = await authorize()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!allowed) return NextResponse.json({ error: 'Recurso não liberado' }, { status: 403 })
  const body = await request.json().catch(() => null)
  if (!body?.id || typeof body.enabled !== 'boolean') return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  try {
    await setActivationEnabled(userId, body.id, body.enabled)
    return NextResponse.json({ activations: await listActivations(userId) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE ?id=...
export async function DELETE(request: NextRequest) {
  const { userId, allowed } = await authorize()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!allowed) return NextResponse.json({ error: 'Recurso não liberado' }, { status: 403 })
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id ausente' }, { status: 400 })
  try {
    await deleteActivation(userId, id)
    return NextResponse.json({ activations: await listActivations(userId) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
