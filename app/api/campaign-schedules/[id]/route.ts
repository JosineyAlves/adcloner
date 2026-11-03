import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/supabase/server'
import { updateSchedule, deleteSchedule } from '@/lib/campaign-schedules'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  try {
    const schedule = await updateSchedule(userId, params.id, {
      pauseTime: body.pauseTime,
      activateTime: body.activateTime,
      daysOfWeek: body.daysOfWeek,
      timezone: body.timezone,
      enabled: typeof body.enabled === 'boolean' ? body.enabled : undefined
    })
    return NextResponse.json({ schedule })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  try {
    await deleteSchedule(userId, params.id)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
