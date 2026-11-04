import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { runDueActivations } from '@/lib/campaign-activations'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Chamado a cada 5 min pelo pg_cron do Supabase (job "campaign-activations-runner", via pg_net) com
// `Authorization: Bearer <ACTIVATION_CRON_SECRET>`. /api/cron é rota pública no middleware — a
// proteção é só este segredo; sem ele configurado a rota recusa tudo.
function authorized(request: NextRequest): boolean {
  const secret = process.env.ACTIVATION_CRON_SECRET
  if (!secret) return false
  const a = Buffer.from(request.headers.get('authorization') || '')
  const b = Buffer.from(`Bearer ${secret}`)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function handle(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const outcomes = await runDueActivations()
    if (outcomes.length > 0) console.log('[campaign-activations]', JSON.stringify(outcomes))
    return NextResponse.json({ ran: outcomes.length, outcomes })
  } catch (err: any) {
    console.error('[campaign-activations] erro:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
