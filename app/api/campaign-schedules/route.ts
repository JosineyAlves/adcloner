import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/supabase/server'
import { listSchedules, upsertSchedules, validateScheduleInput, ScheduleInput } from '@/lib/campaign-schedules'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await getAuthenticatedUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  try {
    return NextResponse.json({ schedules: await listSchedules(userId) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Cria/atualiza (upsert por campanha) o mesmo agendamento para várias campanhas de uma vez.
export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const items: ScheduleInput[] = Array.isArray(body?.schedules) ? body.schedules : []
  if (items.length === 0) return NextResponse.json({ error: 'Nenhuma campanha informada' }, { status: 400 })
  if (items.length > 200) return NextResponse.json({ error: 'Máximo de 200 campanhas por vez' }, { status: 400 })

  for (const item of items) {
    const invalid = validateScheduleInput(item)
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 })
  }

  try {
    return NextResponse.json({ schedules: await upsertSchedules(userId, items) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
