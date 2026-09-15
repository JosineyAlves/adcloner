/**
 * Worker de sincronização: puxa campanhas/adsets/ads/insights das contas conectadas
 * e grava no Supabase. Isolado de lib/facebook-api.ts (clonagem) e de
 * lib/meta-connections.ts (conexão/descoberta de estrutura) — só depende deles
 * para ler o token decriptado de cada conexão.
 *
 * Duas formas de disparo (ver app/api/meta/sync/route.ts):
 *  - Vercel Cron (1x/dia no plano Hobby) — roda automaticamente.
 *  - Botão "Sincronizar agora" na UI — roda sob demanda, sem esperar o cron diário.
 *
 * Cada chamada de graphGetWithHeaders captura os headers de rate limit da Graph API
 * (X-Business-Use-Case-Usage / X-Ad-Account-Usage) e grava em meta_rate_limit_status,
 * para permitir pular contas perto do limite em execuções futuras.
 */

import { getSupabaseAdmin } from './supabase-admin'
import { getDecryptedAccessToken } from './meta-connections'

const GRAPH_API_VERSION = 'v23.0'
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`
const INSIGHTS_LOOKBACK_DAYS = 7
const MAX_USAGE_PERCENT_BEFORE_SKIP = 80

interface GraphResult {
  data: any
  headers: {
    businessUseCaseUsage: any | null
    adAccountUsage: any | null
  }
}

async function graphGetWithHeaders(
  path: string,
  accessToken: string,
  params: Record<string, string> = {}
): Promise<GraphResult> {
  const url = new URL(`${GRAPH_BASE_URL}${path}`)
  url.searchParams.set('access_token', accessToken)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url.toString())
  const data = await response.json()

  const parseHeader = (name: string) => {
    const raw = response.headers.get(name)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  }

  if (data.error) {
    const error = new Error(data.error.message || 'Erro na Graph API')
    ;(error as any).code = data.error.code
    throw error
  }

  return {
    data,
    headers: {
      businessUseCaseUsage: parseHeader('x-business-use-case-usage'),
      adAccountUsage: parseHeader('x-ad-account-usage'),
    },
  }
}

/** Retorna true se a conta estiver perto do limite de rate limit e deve ser pulada agora. */
async function isNearRateLimit(adAccountId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('meta_rate_limit_status')
    .select('business_use_case_usage, ad_account_usage, checked_at')
    .eq('ad_account_id', adAccountId)
    .maybeSingle()

  if (!data) return false

  // Se o último check foi há mais de 1h, o "score" já deve ter decaído — não bloqueia.
  const checkedAt = data.checked_at ? new Date(data.checked_at).getTime() : 0
  if (Date.now() - checkedAt > 60 * 60 * 1000) return false

  const usages = [data.business_use_case_usage, data.ad_account_usage].filter(Boolean)
  for (const usage of usages) {
    const values = Array.isArray(usage) ? usage : Object.values(usage ?? {}).flat()
    for (const entry of values as any[]) {
      const pct = entry?.call_count ?? entry?.total_time ?? entry?.total_cputime
      if (typeof pct === 'number' && pct >= MAX_USAGE_PERCENT_BEFORE_SKIP) return true
    }
  }
  return false
}

async function saveRateLimitStatus(adAccountId: string, headers: GraphResult['headers']) {
  if (!headers.businessUseCaseUsage && !headers.adAccountUsage) return
  const supabase = getSupabaseAdmin()
  await supabase.from('meta_rate_limit_status').upsert(
    {
      ad_account_id: adAccountId,
      business_use_case_usage: headers.businessUseCaseUsage,
      ad_account_usage: headers.adAccountUsage,
      checked_at: new Date().toISOString(),
    },
    { onConflict: 'ad_account_id' }
  )
}

interface SyncRunResult {
  adAccountId: string
  metaAccountId: string
  status: 'success' | 'failed' | 'skipped'
  recordsSynced?: number
  error?: string
}

/** Sincroniza uma única conta de anúncio: campanhas, adsets, ads e insights diários recentes. */
async function syncAdAccount(account: {
  id: string
  connection_id: string
  meta_account_id: string
}): Promise<SyncRunResult> {
  const supabase = getSupabaseAdmin()

  if (await isNearRateLimit(account.id)) {
    return { adAccountId: account.id, metaAccountId: account.meta_account_id, status: 'skipped' }
  }

  const { data: run } = await supabase
    .from('meta_sync_runs')
    .insert({
      ad_account_id: account.id,
      connection_id: account.connection_id,
      scope: 'campaigns_adsets_ads_insights',
      status: 'running',
    })
    .select('id')
    .single()

  try {
    const accessToken = await getDecryptedAccessToken(account.connection_id)
    const actId = `act_${account.meta_account_id}`
    let recordsSynced = 0

    // Campanhas
    const campaignsRes = await graphGetWithHeaders(`/${actId}/campaigns`, accessToken, {
      fields: 'id,name,objective,status,effective_status,daily_budget,lifetime_budget,created_time,updated_time',
      limit: '200',
    })
    await saveRateLimitStatus(account.id, campaignsRes.headers)

    const campaignIdMap = new Map<string, string>() // meta_campaign_id -> uuid interno
    for (const c of campaignsRes.data.data ?? []) {
      const { data: row } = await supabase
        .from('meta_campaigns')
        .upsert(
          {
            ad_account_id: account.id,
            meta_campaign_id: c.id,
            name: c.name ?? null,
            objective: c.objective ?? null,
            status: c.status ?? null,
            effective_status: c.effective_status ?? null,
            daily_budget: c.daily_budget ? Number(c.daily_budget) : null,
            lifetime_budget: c.lifetime_budget ? Number(c.lifetime_budget) : null,
            meta_created_time: c.created_time ?? null,
            meta_updated_time: c.updated_time ?? null,
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: 'ad_account_id,meta_campaign_id' }
        )
        .select('id')
        .single()
      if (row) campaignIdMap.set(c.id, row.id)
      recordsSynced++
    }

    // Ad sets
    const adsetsRes = await graphGetWithHeaders(`/${actId}/adsets`, accessToken, {
      fields:
        'id,name,campaign_id,status,effective_status,daily_budget,lifetime_budget,targeting,created_time,updated_time',
      limit: '200',
    })
    const adsetIdMap = new Map<string, string>()
    for (const a of adsetsRes.data.data ?? []) {
      const { data: row } = await supabase
        .from('meta_adsets')
        .upsert(
          {
            ad_account_id: account.id,
            campaign_id: campaignIdMap.get(a.campaign_id) ?? null,
            meta_adset_id: a.id,
            meta_campaign_id: a.campaign_id ?? null,
            name: a.name ?? null,
            status: a.status ?? null,
            effective_status: a.effective_status ?? null,
            daily_budget: a.daily_budget ? Number(a.daily_budget) : null,
            lifetime_budget: a.lifetime_budget ? Number(a.lifetime_budget) : null,
            targeting: a.targeting ?? null,
            meta_created_time: a.created_time ?? null,
            meta_updated_time: a.updated_time ?? null,
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: 'ad_account_id,meta_adset_id' }
        )
        .select('id')
        .single()
      if (row) adsetIdMap.set(a.id, row.id)
      recordsSynced++
    }

    // Ads
    const adsRes = await graphGetWithHeaders(`/${actId}/ads`, accessToken, {
      fields: 'id,name,adset_id,status,effective_status,creative,created_time,updated_time',
      limit: '200',
    })
    for (const ad of adsRes.data.data ?? []) {
      await supabase.from('meta_ads').upsert(
        {
          ad_account_id: account.id,
          adset_id: adsetIdMap.get(ad.adset_id) ?? null,
          meta_ad_id: ad.id,
          meta_adset_id: ad.adset_id ?? null,
          name: ad.name ?? null,
          status: ad.status ?? null,
          effective_status: ad.effective_status ?? null,
          creative: ad.creative ?? null,
          meta_created_time: ad.created_time ?? null,
          meta_updated_time: ad.updated_time ?? null,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'ad_account_id,meta_ad_id' }
      )
      recordsSynced++
    }

    // Insights diários no nível de campanha, últimos N dias
    const insightsRes = await graphGetWithHeaders(`/${actId}/insights`, accessToken, {
      level: 'campaign',
      fields: 'campaign_id,spend,impressions,clicks,reach,frequency,cpc,ctr,cpm,actions',
      time_range: JSON.stringify({
        since: daysAgo(INSIGHTS_LOOKBACK_DAYS),
        until: daysAgo(0),
      }),
      time_increment: '1',
      limit: '500',
    })
    await saveRateLimitStatus(account.id, insightsRes.headers)

    for (const insight of insightsRes.data.data ?? []) {
      const conversions = (insight.actions ?? []).find((a: any) =>
        ['offsite_conversion', 'purchase', 'lead'].includes(a.action_type)
      )?.value
      await supabase.from('meta_insights_daily').upsert(
        {
          ad_account_id: account.id,
          level: 'campaign',
          object_id: insight.campaign_id,
          date: insight.date_start,
          spend: insight.spend ? Number(insight.spend) : null,
          impressions: insight.impressions ? Number(insight.impressions) : null,
          clicks: insight.clicks ? Number(insight.clicks) : null,
          reach: insight.reach ? Number(insight.reach) : null,
          frequency: insight.frequency ? Number(insight.frequency) : null,
          cpc: insight.cpc ? Number(insight.cpc) : null,
          ctr: insight.ctr ? Number(insight.ctr) : null,
          cpm: insight.cpm ? Number(insight.cpm) : null,
          conversions: conversions ? Number(conversions) : null,
          raw: insight,
        },
        { onConflict: 'ad_account_id,level,object_id,date' }
      )
      recordsSynced++
    }

    await supabase
      .from('meta_ad_accounts')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', account.id)

    if (run) {
      await supabase
        .from('meta_sync_runs')
        .update({ status: 'success', finished_at: new Date().toISOString(), records_synced: recordsSynced })
        .eq('id', run.id)
    }

    return {
      adAccountId: account.id,
      metaAccountId: account.meta_account_id,
      status: 'success',
      recordsSynced,
    }
  } catch (error: any) {
    if (run) {
      await supabase
        .from('meta_sync_runs')
        .update({ status: 'failed', finished_at: new Date().toISOString(), error: error.message })
        .eq('id', run.id)
    }
    return {
      adAccountId: account.id,
      metaAccountId: account.meta_account_id,
      status: 'failed',
      error: error.message,
    }
  }
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

/**
 * Sincroniza todas as contas com sync_enabled=true, uma de cada vez (sequencial,
 * de propósito — evita rajada de chamadas simultâneas contra o rate limit do Meta).
 * `limit` protege contra timeout de função serverless (Vercel Hobby: 10s por padrão,
 * ou o configurado em maxDuration da rota).
 */
export async function syncAllDueAccounts(limit = 5): Promise<SyncRunResult[]> {
  const supabase = getSupabaseAdmin()

  const { data: accounts, error } = await supabase
    .from('meta_ad_accounts')
    .select('id, connection_id, meta_account_id')
    .eq('sync_enabled', true)
    .order('last_synced_at', { ascending: true, nullsFirst: true })
    .limit(limit)

  if (error) throw new Error(`Falha ao buscar contas para sincronizar: ${error.message}`)
  if (!accounts || accounts.length === 0) return []

  const results: SyncRunResult[] = []
  for (const account of accounts) {
    results.push(await syncAdAccount(account))
  }
  return results
}

export async function listRecentSyncRuns(limit = 20) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('meta_sync_runs')
    .select(
      'id, scope, status, started_at, finished_at, records_synced, error, meta_ad_accounts ( meta_account_id, name )'
    )
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Falha ao listar execuções de sincronização: ${error.message}`)
  return data ?? []
}
