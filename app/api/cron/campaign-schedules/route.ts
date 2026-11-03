import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { runDueSchedules } from '@/lib/campaign-schedules'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Chamado a cada 5 min pelo pg_cron do Supabase (job "campaign-schedules-runner", via pg_net),
// com `Authorization: Bearer <CRON_SECRET>`. /api/cron é rota pública no middleware — a proteção
// é só este segredo, então sem CRON_SECRET configurado a rota recusa tudo.
function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization') || ''
  const expected = `Bearer ${secret}`
  const a = Buffer.from(header)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function handle(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const outcomes = await runDueSchedules()
    if (outcomes.length > 0) console.log('[campaign-schedules]', JSON.stringify(outcomes))
    return NextResponse.json({ ran: outcomes.length, outcomes })
  } catch (err: any) {
    console.error('[campaign-schedules] erro:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
