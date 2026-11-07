/**
 * Ativação agendada de campanhas (recurso experimental, liberado só para e-mails listados em
 * ACTIVATION_SCHEDULE_EMAILS).
 *
 * Motivo: campanhas já publicadas não aceitam programação de horário, mas o STATUS pode ser trocado
 * a qualquer momento (mesmo POST {campaign}?status=ACTIVE do toggle manual da tela). O usuário pausa
 * a campanha à noite e este recurso a ativa sozinho no horário escolhido (horário de Brasília).
 *
 * Só ATIVA, nunca pausa. Só ativa campanha que esteja PAUSED naquele momento.
 * Janela de 30 min após o horário (cobre atraso do cron); em caso de erro tenta de novo no cron
 * seguinte, dentro da janela.
 *
 * COMO REMOVER: apagar os arquivos campaign-activation* (lib, components, app/api/campaign-activations,
 * app/api/cron/campaign-activations), o botão de relógio + <CampaignActivationsModal/> e o hook
 * useActivationAccess em app/meta-ads-manager/page.tsx e rodar sql/campaign-activations-remove.sql.
 *
 * ⚠️ Server-only (service_role key).
 */

import { getSupabaseAdmin } from './supabase-admin'
import { getAccessTokenForAdAccount } from './meta-connections'
import { BRAZIL_TIMEZONE } from './timezone'

const GRAPH = 'https://graph.facebook.com/v23.0'
const WINDOW_MINUTES = 30
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/

export interface CampaignActivation {
  id: string
  user_id: string
  meta_campaign_id: string
  meta_account_id: string
  campaign_name: string | null
  activate_time: string // 'HH:MM:SS'
  days_of_week: number[] // 0 = domingo
  enabled: boolean
  last_run_date: string | null
  last_run_at: string | null
  last_result: 'success' | 'skipped' | 'error' | null
  last_message: string | null
}

export interface ActivationRun {
  id: string
  activation_id: string | null
  meta_campaign_id: string
  campaign_name: string | null
  ran_at: string
  result: 'success' | 'skipped' | 'error'
  message: string | null
}

export interface ActivationInput {
  campaignId: string
  accountId: string
  campaignName?: string | null
  activateTime: string // 'HH:MM'
  daysOfWeek: number[]
}

// ---- Acesso restrito (feature flag por e-mail) -----------------------------------------------

export async function isActivationUser(userId: string): Promise<boolean> {
  const allowed = (process.env.ACTIVATION_SCHEDULE_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  if (allowed.length === 0) return false
  const { data } = await getSupabaseAdmin().auth.admin.getUserById(userId)
  const email = data?.user?.email?.toLowerCase()
  return !!email && allowed.includes(email)
}

// ---- CRUD (sempre filtrando por user_id) ------------------------------------------------------

// Histórico de execuções (tabela campaign_activation_runs). Falha aqui nunca derruba a tela.
export async function listRuns(userId: string, limit = 60): Promise<ActivationRun[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('campaign_activation_runs')
    .select('id, activation_id, meta_campaign_id, campaign_name, ran_at, result, message')
    .eq('user_id', userId)
    .order('ran_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return (data ?? []) as ActivationRun[]
}

export function validateInput(i: ActivationInput): string | null {
  if (!i.campaignId || !i.accountId) return 'Campanha ou conta ausente.'
  if (!TIME_RE.test(i.activateTime)) return 'Horário inválido (use HH:MM).'
  if (!Array.isArray(i.daysOfWeek) || i.daysOfWeek.length === 0) return 'Selecione pelo menos um dia.'
  if (i.daysOfWeek.some(d => !Number.isInteger(d) || d < 0 || d > 6)) return 'Dia da semana inválido.'
  return null
}

export async function listActivations(userId: string): Promise<CampaignActivation[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('campaign_activations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as CampaignActivation[]
}

export async function upsertActivations(userId: string, inputs: ActivationInput[]): Promise<void> {
  // Confirma que cada conta pertence ao usuário (mesma checagem multi-tenant do resto do app).
  for (const i of inputs) {
    if (!(await getAccessTokenForAdAccount(i.accountId, userId))) {
      throw new Error(`Conta ${i.accountId} não pertence a este usuário.`)
    }
  }
  const rows = inputs.map(i => ({
    user_id: userId,
    meta_campaign_id: i.campaignId,
    meta_account_id: i.accountId.replace(/^act_/, ''),
    campaign_name: i.campaignName ?? null,
    activate_time: i.activateTime,
    days_of_week: Array.from(new Set(i.daysOfWeek)).sort(),
    enabled: true,
    updated_at: new Date().toISOString()
  }))
  const { error } = await getSupabaseAdmin()
    .from('campaign_activations')
    .upsert(rows, { onConflict: 'user_id,meta_campaign_id' })
  if (error) throw new Error(error.message)
}

export async function setActivationEnabled(userId: string, id: string, enabled: boolean): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('campaign_activations')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
}

export async function deleteActivation(userId: string, id: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('campaign_activations')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
}

// ---- Execução (chamada pelo cron a cada 5 min) ------------------------------------------------

function localNow(at: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BRAZIL_TIMEZONE,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', weekday: 'short'
  }).formatToParts(at)
  const p: Record<string, string> = {}
  for (const part of parts) p[part.type] = part.value
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    minutes: (+p.hour % 24) * 60 + +p.minute,
    weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday)
  }
}

function inWindow(nowMinutes: number, target: string): boolean {
  const [h, m] = target.split(':').map(Number)
  return (nowMinutes - (h * 60 + m) + 1440) % 1440 < WINDOW_MINUTES
}

async function graph(campaignId: string, token: string, method: 'GET' | 'POST') {
  const res = method === 'GET'
    ? await fetch(`${GRAPH}/${campaignId}?fields=status&access_token=${encodeURIComponent(token)}`, { cache: 'no-store' })
    : await fetch(`${GRAPH}/${campaignId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ status: 'ACTIVE', access_token: token })
      })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data
}

async function record(a: CampaignActivation, result: 'success' | 'skipped' | 'error', message: string, doneDate?: string) {
  const id = a.id
  // Histórico (1 linha por tentativa). Best-effort: se falhar, o agendamento segue normalmente.
  await getSupabaseAdmin()
    .from('campaign_activation_runs')
    .insert({
      user_id: a.user_id,
      activation_id: a.id,
      meta_campaign_id: a.meta_campaign_id,
      campaign_name: a.campaign_name,
      result,
      message
    })
  await getSupabaseAdmin()
    .from('campaign_activations')
    .update({
      last_run_at: new Date().toISOString(),
      last_result: result,
      last_message: message,
      ...(doneDate ? { last_run_date: doneDate } : {})
    })
    .eq('id', id)
}

async function processOne(a: CampaignActivation, at: Date): Promise<string | null> {
  const now = localNow(at)
  if (!a.days_of_week.includes(now.weekday)) return null
  if (!inWindow(now.minutes, a.activate_time)) return null
  if (a.last_run_date === now.date) return null

  const token = await getAccessTokenForAdAccount(a.meta_account_id, a.user_id)
  if (!token) {
    await record(a, 'error', 'Conexão com o Facebook não encontrada para esta conta. Reconecte em Integrações.')
    return 'error: sem token'
  }
  try {
    const { status } = await graph(a.meta_campaign_id, token, 'GET')
    if (status !== 'PAUSED') {
      await record(a, 'skipped', `Não ativada: a campanha já estava ${status}.`, now.date)
      return `skipped: ${status}`
    }
    await graph(a.meta_campaign_id, token, 'POST')
    await record(a, 'success', 'Campanha ativada pelo agendamento.', now.date)
    return 'success'
  } catch (err: any) {
    // Não marca o dia como feito: o cron seguinte (5 min) tenta de novo, ainda dentro da janela.
    await record(a, 'error', `Erro da Meta: ${err?.message || 'desconhecido'}`)
    return `error: ${err?.message}`
  }
}

export async function runDueActivations(at: Date = new Date()): Promise<{ id: string; outcome: string }[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('campaign_activations')
    .select('*')
    .eq('enabled', true)
  if (error) throw new Error(error.message)

  const allowedCache = new Map<string, boolean>()
  const outcomes: { id: string; outcome: string }[] = []
  for (const a of (data ?? []) as CampaignActivation[]) {
    if (!allowedCache.has(a.user_id)) allowedCache.set(a.user_id, await isActivationUser(a.user_id))
    if (!allowedCache.get(a.user_id)) continue
    try {
      const outcome = await processOne(a, at)
      if (outcome) outcomes.push({ id: a.id, outcome })
    } catch (err: any) {
      outcomes.push({ id: a.id, outcome: `error: ${err?.message || 'erro'}` })
    }
  }
  return outcomes
}
