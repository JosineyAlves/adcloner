/**
 * Agendamento automático de pausa/ativação de campanhas (ex.: pausar 00:00, ativar 07:00).
 *
 * Motivo: campanhas já publicadas não aceitam programação de horário (dayparting exige orçamento
 * vitalício definido na criação), mas o STATUS pode ser trocado a qualquer momento — é o mesmo
 * POST {campaign}?status=ACTIVE|PAUSED que o toggle manual da tela já usa. Aqui ele é disparado
 * por um job no servidor (pg_cron do Supabase chamando /api/cron/campaign-schedules a cada 5 min).
 *
 * Regras de segurança (para nunca reativar uma campanha que o usuário quis desligar):
 * - Pausa só acontece se a campanha estiver de fato ACTIVE naquele momento; só então marcamos
 *   `paused_by_schedule = true`.
 * - Ativação só acontece se `paused_by_schedule = true` (foi o agendador que pausou) e a campanha
 *   ainda estiver PAUSED. Se o usuário ativou manualmente de madrugada, só limpamos a marca.
 * - Os dias da semana valem para a PAUSA. A ativação que desfaz uma pausa nossa roda sempre —
 *   senão uma pausa de sexta 23h com "só dias úteis" deixaria a campanha parada o fim de semana todo.
 * - Janela de tolerância de 30 min após o horário: cobre atraso do cron, mas não dispara uma ação
 *   "atrasada" horas depois só porque o agendamento foi criado no meio do dia.
 *
 * ⚠️ Server-only (usa a service_role key).
 */

import { getSupabaseAdmin } from './supabase-admin'
import { getAccessTokenForAdAccount } from './meta-connections'
import { isValidTimezone, BRAZIL_TIMEZONE } from './timezone'

const GRAPH = 'https://graph.facebook.com/v23.0'
const WINDOW_MINUTES = 30

export interface CampaignSchedule {
  id: string
  user_id: string
  meta_campaign_id: string
  meta_account_id: string
  campaign_name: string | null
  pause_time: string // 'HH:MM:SS'
  activate_time: string
  days_of_week: number[] // 0 = domingo
  timezone: string
  enabled: boolean
  paused_by_schedule: boolean
  last_pause_date: string | null
  last_activate_date: string | null
  last_action: string | null
  last_action_at: string | null
  last_result: string | null
  last_message: string | null
  created_at: string
  updated_at: string
}

export interface ScheduleInput {
  campaignId: string
  accountId: string
  campaignName?: string | null
  pauseTime: string // 'HH:MM'
  activateTime: string
  daysOfWeek: number[]
  timezone?: string
  enabled?: boolean
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/

export function validateScheduleInput(input: ScheduleInput): string | null {
  if (!input.campaignId || !input.accountId) return 'Campanha ou conta ausente.'
  if (!TIME_RE.test(input.pauseTime) || !TIME_RE.test(input.activateTime)) return 'Horário inválido (use HH:MM).'
  const gap = (timeToMinutes(input.activateTime) - timeToMinutes(input.pauseTime) + 1440) % 1440
  if (gap < WINDOW_MINUTES || gap > 1440 - WINDOW_MINUTES) return 'Deixe pelo menos 30 minutos entre a pausa e a ativação.'
  if (!Array.isArray(input.daysOfWeek) || input.daysOfWeek.length === 0) return 'Selecione pelo menos um dia da semana.'
  if (input.daysOfWeek.some(d => !Number.isInteger(d) || d < 0 || d > 6)) return 'Dia da semana inválido.'
  if (input.timezone && !isValidTimezone(input.timezone)) return 'Fuso horário inválido.'
  return null
}

// ---------------------------------------------------------------------------------------------
// CRUD (sempre filtrando por user_id — a rota já autenticou o usuário)
// ---------------------------------------------------------------------------------------------

export async function listSchedules(userId: string): Promise<CampaignSchedule[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('campaign_schedules')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as CampaignSchedule[]
}

export async function upsertSchedules(userId: string, inputs: ScheduleInput[]): Promise<CampaignSchedule[]> {
  // Garante que cada conta pertence ao usuário antes de gravar (mesma checagem multi-tenant do
  // resolvedor de token) — senão alguém poderia agendar campanha de outra conta.
  for (const input of inputs) {
    const token = await getAccessTokenForAdAccount(input.accountId, userId)
    if (!token) throw new Error(`Conta ${input.accountId} não pertence a este usuário.`)
  }

  const rows = inputs.map(input => ({
    user_id: userId,
    meta_campaign_id: input.campaignId,
    meta_account_id: input.accountId.replace(/^act_/, ''),
    campaign_name: input.campaignName ?? null,
    pause_time: input.pauseTime,
    activate_time: input.activateTime,
    days_of_week: Array.from(new Set(input.daysOfWeek)).sort(),
    timezone: input.timezone || BRAZIL_TIMEZONE,
    enabled: input.enabled ?? true,
    updated_at: new Date().toISOString()
  }))

  const { data, error } = await getSupabaseAdmin()
    .from('campaign_schedules')
    .upsert(rows, { onConflict: 'user_id,meta_campaign_id' })
    .select('*')
  if (error) throw new Error(error.message)
  return (data ?? []) as CampaignSchedule[]
}

export async function updateSchedule(
  userId: string,
  id: string,
  patch: Partial<Pick<ScheduleInput, 'pauseTime' | 'activateTime' | 'daysOfWeek' | 'timezone' | 'enabled'>>
): Promise<CampaignSchedule> {
  const supabase = getSupabaseAdmin()
  const { data: current } = await supabase
    .from('campaign_schedules')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()
  if (!current) throw new Error('Agendamento não encontrado.')
  const merged: ScheduleInput = {
    campaignId: current.meta_campaign_id,
    accountId: current.meta_account_id,
    pauseTime: patch.pauseTime ?? current.pause_time,
    activateTime: patch.activateTime ?? current.activate_time,
    daysOfWeek: patch.daysOfWeek ?? current.days_of_week,
    timezone: patch.timezone ?? current.timezone
  }
  const invalid = validateScheduleInput(merged)
  if (invalid) throw new Error(invalid)

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.pauseTime !== undefined) update.pause_time = patch.pauseTime
  if (patch.activateTime !== undefined) update.activate_time = patch.activateTime
  if (patch.daysOfWeek !== undefined) update.days_of_week = Array.from(new Set(patch.daysOfWeek)).sort()
  if (patch.timezone !== undefined) update.timezone = patch.timezone
  if (patch.enabled !== undefined) update.enabled = patch.enabled

  const { data, error } = await getSupabaseAdmin()
    .from('campaign_schedules')
    .update(update)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()
  if (error || !data) throw new Error(error?.message || 'Agendamento não encontrado.')
  return data as CampaignSchedule
}

export async function deleteSchedule(userId: string, id: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('campaign_schedules')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------------------------
// Execução (chamada pelo cron)
// ---------------------------------------------------------------------------------------------

interface LocalNow {
  date: string // 'AAAA-MM-DD'
  minutes: number // minutos desde 00:00
  weekday: number // 0 = domingo
}

export function localNow(tz: string, at: Date = new Date()): LocalNow {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: isValidTimezone(tz) ? tz : BRAZIL_TIMEZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short'
  }).formatToParts(at)
  const p: Record<string, string> = {}
  for (const part of parts) p[part.type] = part.value
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    minutes: (+p.hour % 24) * 60 + +p.minute,
    weekday: weekdays.indexOf(p.weekday)
  }
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** Está dentro da janela [horário, horário + 30 min)? Considera a virada da meia-noite. */
export function isWithinWindow(nowMinutes: number, target: string): boolean {
  const diff = (nowMinutes - timeToMinutes(target) + 1440) % 1440
  return diff < WINDOW_MINUTES
}

async function getCampaignStatus(campaignId: string, token: string): Promise<string> {
  const res = await fetch(`${GRAPH}/${campaignId}?fields=status&access_token=${encodeURIComponent(token)}`, { cache: 'no-store' })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.status as string
}

async function setCampaignStatus(campaignId: string, token: string, status: 'ACTIVE' | 'PAUSED') {
  const res = await fetch(`${GRAPH}/${campaignId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ status, access_token: token })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
}

export interface RunOutcome {
  scheduleId: string
  campaignId: string
  action: 'pause' | 'activate'
  result: 'success' | 'skipped' | 'error'
  message: string
}

async function record(
  id: string,
  fields: Record<string, unknown>,
  action: 'pause' | 'activate',
  result: RunOutcome['result'],
  message: string
) {
  await getSupabaseAdmin()
    .from('campaign_schedules')
    .update({
      ...fields,
      last_action: action,
      last_action_at: new Date().toISOString(),
      last_result: result,
      last_message: message
    })
    .eq('id', id)
}

async function processSchedule(s: CampaignSchedule, at: Date): Promise<RunOutcome | null> {
  const now = localNow(s.timezone, at)

  const pauseDue =
    s.enabled &&
    s.days_of_week.includes(now.weekday) &&
    isWithinWindow(now.minutes, s.pause_time) &&
    s.last_pause_date !== now.date

  const activateDue =
    s.paused_by_schedule &&
    isWithinWindow(now.minutes, s.activate_time) &&
    s.last_activate_date !== now.date

  if (!pauseDue && !activateDue) return null
  const action: 'pause' | 'activate' = activateDue ? 'activate' : 'pause'
  const base = { scheduleId: s.id, campaignId: s.meta_campaign_id, action }

  const token = await getAccessTokenForAdAccount(s.meta_account_id, s.user_id)
  if (!token) {
    const message = 'Conexão com o Facebook não encontrada para esta conta. Reconecte em Integrações.'
    await record(s.id, action === 'pause' ? { last_pause_date: now.date } : { last_activate_date: now.date }, action, 'error', message)
    return { ...base, result: 'error', message }
  }

  try {
    const status = await getCampaignStatus(s.meta_campaign_id, token)

    if (action === 'pause') {
      if (status !== 'ACTIVE') {
        const message = `Não pausada: a campanha já estava ${status}. Ela não será ativada automaticamente hoje.`
        await record(s.id, { last_pause_date: now.date, paused_by_schedule: false }, action, 'skipped', message)
        return { ...base, result: 'skipped', message }
      }
      await setCampaignStatus(s.meta_campaign_id, token, 'PAUSED')
      const message = 'Campanha pausada pelo agendamento.'
      await record(s.id, { last_pause_date: now.date, paused_by_schedule: true }, action, 'success', message)
      return { ...base, result: 'success', message }
    }

    // activate
    if (status !== 'PAUSED') {
      const message = `Não ativada: a campanha estava ${status} (alterada manualmente?).`
      await record(s.id, { last_activate_date: now.date, paused_by_schedule: false }, action, 'skipped', message)
      return { ...base, result: 'skipped', message }
    }
    await setCampaignStatus(s.meta_campaign_id, token, 'ACTIVE')
    const message = 'Campanha ativada pelo agendamento.'
    await record(s.id, { last_activate_date: now.date, paused_by_schedule: false }, action, 'success', message)
    return { ...base, result: 'success', message }
  } catch (err: any) {
    // Na ativação, NÃO marcamos o dia como feito: a próxima execução (5 min depois, ainda dentro da
    // janela) tenta de novo — falhar em reativar é o pior caso, campanha parada o dia todo.
    const message = `Erro da Meta: ${err?.message || 'desconhecido'}`
    await record(s.id, action === 'pause' ? { last_pause_date: now.date } : {}, action, 'error', message)
    return { ...base, result: 'error', message }
  }
}

export async function runDueSchedules(at: Date = new Date()): Promise<RunOutcome[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('campaign_schedules')
    .select('*')
    // Desligados também entram se ainda houver uma pausa nossa pendente de desfazer — desligar o
    // agendamento de madrugada não pode deixar a campanha parada.
    .or('enabled.eq.true,paused_by_schedule.eq.true')
  if (error) throw new Error(error.message)

  const schedules = (data ?? []) as CampaignSchedule[]
  const outcomes: RunOutcome[] = []
  // Lotes pequenos em paralelo: rápido o bastante para caber no tempo da função, sem rajada na Meta.
  for (let i = 0; i < schedules.length; i += 5) {
    const batch = await Promise.all(
      schedules.slice(i, i + 5).map(s =>
        processSchedule(s, at).catch(err => ({
          scheduleId: s.id,
          campaignId: s.meta_campaign_id,
          action: 'pause' as const,
          result: 'error' as const,
          message: err?.message || 'erro'
        }))
      )
    )
    for (const o of batch) if (o) outcomes.push(o)
  }
  return outcomes
}
