import { NextRequest, NextResponse } from 'next/server'
import { FacebookBatchAPI } from '@/lib/facebook-batch-api'
import { cache } from '@/lib/cache'
import {
  getRateLimitBlock,
  setRateLimitBlock,
  isRateLimitErrorBody,
  saveLastGood,
  getLastGood,
  retryAfterSecondsFor
} from '@/lib/meta-rate-limit'
import { resolveMetaAccessToken } from '@/lib/meta-connections'
import { getAuthenticatedUserId } from '@/lib/supabase/server'
import { BRAZIL_TIMEZONE, convertDateHour, isValidTimezone } from '@/lib/timezone'

// Dados do gráfico "Horas sem Venda" (Dashboard): gasto, vendas e receita por DIA e por HORA,
// já convertidos para o horário de Brasília. A Meta devolve a hora no fuso da conta de anúncio
// (ex.: "EST"); aqui cada linha é reposicionada para Brasília para que contas em fusos
// diferentes possam ser somadas no cliente sem misturar horários.

const facebookBatchAPI = new FacebookBatchAPI()

// Mesmas variantes de action_type usadas em insights-breakdown/route.ts para o evento de compra.
const PURCHASE_ACTION_TYPES = [
  'omni_purchase',
  'onsite_web_purchase',
  'onsite_web_app_purchase',
  'offsite_conversion.fb_pixel_purchase',
  'web_in_store_purchase',
  'web_app_in_store_purchase',
  'purchase'
]

function sumActionStats(metric: any): number {
  if (!metric) return 0
  if (Array.isArray(metric)) {
    return metric.reduce((total, action) => total + parseFloat(action.value || '0'), 0)
  }
  return parseFloat(metric.toString() || '0')
}

function extractPurchaseValue(actionsMetric: any): number {
  if (!actionsMetric || !Array.isArray(actionsMetric)) return 0
  for (const candidateType of PURCHASE_ACTION_TYPES) {
    const action = actionsMetric.find((item: any) => item.action_type === candidateType)
    if (action) return parseFloat(action.value || '0')
  }
  return 0
}

interface HourlyRow {
  date: string // AAAA-MM-DD em horário de Brasília
  hour: number // 0-23 em horário de Brasília
  spend: number
  conversions: number
  conversionValues: number
}

const EMPTY = { rows: [] as HourlyRow[], timezone: null as string | null }
// Limite de páginas para períodos longos (500 linhas por página = ~20 dias de 24h por página).
const MAX_PAGES = 6

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId') || searchParams.get('account_id')
    const datePreset = searchParams.get('datePreset') || searchParams.get('date_preset') || 'today'
    const since = searchParams.get('since')
    const until = searchParams.get('until')

    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }
    const accessToken = await resolveMetaAccessToken(request.cookies.get('fb_access_token')?.value, accountId, userId)
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 401 })
    }

    const cacheKey = cache.generateKey('hourly-funnel', { accountId, datePreset, since, until })

    const rateLimitedPayload = (stale: any) => ({
      ...(stale?.data || EMPTY),
      rateLimited: true,
      retryAfterSeconds: retryAfterSecondsFor(accountId),
      message: 'Limite de requisições da Meta atingido para esta conta. Aguarde antes de tentar novamente.'
    })

    if (getRateLimitBlock(accountId)) {
      return NextResponse.json(rateLimitedPayload(getLastGood<any>(cacheKey)), { status: 429 })
    }

    try {
      const batch = facebookBatchAPI.createHourlyByDayBatch(accountId, datePreset, since || undefined, until || undefined)
      const { responses, estimatedWaitMinutes } = await facebookBatchAPI.makeBatchRequest(batch, accessToken)

      const rateLimitedResponse = responses.find((r) => {
        if (r.code === 200) return false
        try {
          return isRateLimitErrorBody(JSON.parse(r.body || '{}'))
        } catch {
          return false
        }
      })
      if (rateLimitedResponse) {
        const errorData = JSON.parse(rateLimitedResponse.body || '{}')
        setRateLimitBlock(accountId, estimatedWaitMinutes, errorData.error?.message || 'Rate limit da Meta')
        return NextResponse.json(rateLimitedPayload(getLastGood<any>(cacheKey)), { status: 429 })
      }

      const [tzRes, insightsRes] = responses
      if (insightsRes.code !== 200) {
        console.error('❌ Erro no insights por hora/dia:', insightsRes.body)
        return NextResponse.json({ error: 'Failed to fetch hourly insights' }, { status: 502 })
      }

      let timezone: string | null = null
      if (tzRes.code === 200) {
        const tz = JSON.parse(tzRes.body || '{}').timezone_name
        if (isValidTimezone(tz)) timezone = tz
      }
      // Sem fuso confiável da conta, assume que as horas já estão em Brasília em vez de chutar
      // outro fuso — e devolve timezone=null para o cliente poder avisar.
      const fromTz = timezone || BRAZIL_TIMEZONE

      const insightsBody = JSON.parse(insightsRes.body || '{}')
      const rawRows: any[] = [...(insightsBody.data || [])]
      let next: string | undefined = insightsBody.paging?.next
      let pages = 1
      while (next && pages < MAX_PAGES) {
        const pageRes = await fetch(next)
        if (!pageRes.ok) break
        const page = await pageRes.json()
        rawRows.push(...(page.data || []))
        next = page.paging?.next
        pages++
      }

      const merged = new Map<string, HourlyRow>()
      for (const row of rawRows) {
        const rawHour = row.hourly_stats_aggregated_by_advertiser_time_zone as string | undefined
        if (!rawHour || !row.date_start) continue
        const hour = parseInt(rawHour.split(':')[0], 10)
        if (Number.isNaN(hour)) continue
        const converted = convertDateHour(row.date_start, hour, fromTz, BRAZIL_TIMEZONE)
        const key = `${converted.date}|${converted.hour}`
        const spend = parseFloat(row.spend || '0')
        const conversions = sumActionStats(row.conversions) || extractPurchaseValue(row.actions)
        const conversionValues = sumActionStats(row.conversion_values) || extractPurchaseValue(row.action_values)
        const existing = merged.get(key)
        if (existing) {
          existing.spend += spend
          existing.conversions += conversions
          existing.conversionValues += conversionValues
        } else {
          merged.set(key, { date: converted.date, hour: converted.hour, spend, conversions, conversionValues })
        }
      }

      const result = {
        rows: Array.from(merged.values()).sort((a, b) => (a.date === b.date ? a.hour - b.hour : a.date < b.date ? -1 : 1)),
        timezone,
        truncated: Boolean(next)
      }
      saveLastGood(cacheKey, result)
      return NextResponse.json(result)
    } catch (error) {
      console.error('❌ Erro ao processar insights por hora/dia:', error)
      return NextResponse.json({ error: 'Failed to process hourly insights' }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ Erro geral na rota hourly-funnel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
