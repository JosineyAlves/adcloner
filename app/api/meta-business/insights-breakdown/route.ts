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

const facebookBatchAPI = new FacebookBatchAPI()

interface BreakdownRow {
  label: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  conversionValues: number
}

// Mesmas variantes de action_type que o Meta usa pra reportar o mesmo evento de compra
// dependendo da origem do sinal — ver comentário equivalente em
// app/api/meta-business/accounts/route.ts e campaigns/route.ts.
const PURCHASE_ACTION_TYPES = [
  'omni_purchase',
  'onsite_web_purchase',
  'onsite_web_app_purchase',
  'offsite_conversion.fb_pixel_purchase',
  'web_in_store_purchase',
  'web_app_in_store_purchase',
  'purchase',
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

function extractRowMetrics(row: any) {
  return {
    spend: parseFloat(row.spend || '0'),
    impressions: parseInt(row.impressions || '0'),
    clicks: parseInt(row.clicks || '0'),
    conversions: sumActionStats(row.conversions) || extractPurchaseValue(row.actions),
    conversionValues: sumActionStats(row.conversion_values) || extractPurchaseValue(row.action_values)
  }
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId') || searchParams.get('account_id')
    const datePreset = searchParams.get('datePreset') || searchParams.get('date_preset') || 'last_7d'
    const since = searchParams.get('since')
    const until = searchParams.get('until')
    const accessToken = await resolveMetaAccessToken(request.cookies.get('fb_access_token')?.value, accountId)

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 401 })
    }
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    const cacheKey = cache.generateKey('insights-breakdown', { accountId, datePreset, since, until })
    const cachedData = cache.get(cacheKey)
    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    const existingBlock = getRateLimitBlock(accountId)
    if (existingBlock) {
      const stale = getLastGood<any>(cacheKey)
      return NextResponse.json(
        {
          ...(stale?.data || { country: [], hour: [], weekday: [] }),
          rateLimited: true,
          retryAfterSeconds: retryAfterSecondsFor(accountId),
          message: 'Limite de requisições da Meta atingido para esta conta. Aguarde antes de tentar novamente.'
        },
        { status: 429 }
      )
    }

    try {
      const batch = facebookBatchAPI.createAccountInsightsBreakdownBatch(accountId, datePreset, since || undefined, until || undefined)
      const { responses, estimatedWaitMinutes } = await facebookBatchAPI.makeBatchRequest(batch, accessToken)

      // Se qualquer uma das 3 sub-requisições bateu em rate limit, trata a conta inteira como
      // bloqueada (mesmo critério das outras rotas) em vez de servir dados parciais.
      const rateLimitedResponse = responses.find((r) => {
        if (r.code === 200) return false
        try {
          const body = JSON.parse(r.body || '{}')
          return isRateLimitErrorBody(body)
        } catch {
          return false
        }
      })
      if (rateLimitedResponse) {
        const errorData = JSON.parse(rateLimitedResponse.body || '{}')
        setRateLimitBlock(accountId, estimatedWaitMinutes, errorData.error?.message || 'Rate limit da Meta')
        const stale = getLastGood<any>(cacheKey)
        return NextResponse.json(
          {
            ...(stale?.data || { country: [], hour: [], weekday: [] }),
            rateLimited: true,
            retryAfterSeconds: retryAfterSecondsFor(accountId),
            message: 'Limite de requisições da Meta atingido para esta conta. Aguarde antes de tentar novamente.'
          },
          { status: 429 }
        )
      }

      const [countryRes, hourRes, dailyRes] = responses

      // País — uma linha por país já agregada no período inteiro pela própria API.
      const country: BreakdownRow[] = []
      if (countryRes.code === 200) {
        const data = JSON.parse(countryRes.body || '{}').data || []
        for (const row of data) {
          if (!row.country) continue
          country.push({ label: row.country, ...extractRowMetrics(row) })
        }
        country.sort((a, b) => b.conversionValues - a.conversionValues)
      }

      // Hora — uma linha por faixa horária (ex.: "13:00:00 - 13:59:59"), já agregada no período
      // inteiro. Extrai só a hora inicial pra virar rótulo "13h" e ordena 0h→23h.
      const hourMap = new Map<number, BreakdownRow>()
      if (hourRes.code === 200) {
        const data = JSON.parse(hourRes.body || '{}').data || []
        for (const row of data) {
          const raw = row.hourly_stats_aggregated_by_advertiser_time_zone as string | undefined
          if (!raw) continue
          const hour = parseInt(raw.split(':')[0], 10)
          if (Number.isNaN(hour)) continue
          const metrics = extractRowMetrics(row)
          const existing = hourMap.get(hour)
          if (existing) {
            existing.spend += metrics.spend
            existing.impressions += metrics.impressions
            existing.clicks += metrics.clicks
            existing.conversions += metrics.conversions
            existing.conversionValues += metrics.conversionValues
          } else {
            hourMap.set(hour, { label: `${hour.toString().padStart(2, '0')}h`, ...metrics })
          }
        }
      }
      const hour = Array.from(hourMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([, row]) => row)

      // Dia da semana — não é um breakdown nativo da Meta; derivado agregando as linhas diárias
      // (time_increment=1) por dia da semana do `date_start` de cada uma.
      const weekdayTotals: BreakdownRow[] = WEEKDAY_LABELS.map((label) => ({
        label,
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        conversionValues: 0
      }))
      if (dailyRes.code === 200) {
        const data = JSON.parse(dailyRes.body || '{}').data || []
        for (const row of data) {
          if (!row.date_start) continue
          // date_start vem "YYYY-MM-DD" sem horário — parseia como UTC pra não deslocar o dia
          // da semana conforme o timezone do servidor.
          const weekdayIndex = new Date(`${row.date_start}T00:00:00Z`).getUTCDay()
          const metrics = extractRowMetrics(row)
          const bucket = weekdayTotals[weekdayIndex]
          bucket.spend += metrics.spend
          bucket.impressions += metrics.impressions
          bucket.clicks += metrics.clicks
          bucket.conversions += metrics.conversions
          bucket.conversionValues += metrics.conversionValues
        }
      }

      const result = { country, hour, weekday: weekdayTotals }

      cache.set(cacheKey, result, 300)
      saveLastGood(cacheKey, result)

      return NextResponse.json(result)
    } catch (error) {
      console.error('❌ Erro ao processar insights segmentados da conta:', error)
      return NextResponse.json({ error: 'Failed to process account insights breakdown' }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ Erro geral na rota de insights-breakdown:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
