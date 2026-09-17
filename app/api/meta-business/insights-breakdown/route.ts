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

// Rótulos amigáveis para os valores brutos que a Meta retorna em publisher_platform/
// platform_position — qualquer valor não mapeado aqui cai no fallback (capitaliza e troca "_"
// por espaço), então um novo posicionamento lançado pela Meta nunca quebra, só aparece "cru".
const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  audience_network: 'Audience Network',
  messenger: 'Messenger'
}

// Junta mobile_app/mobile_web num único rótulo "Mobile" — o pedido do usuário foi
// especificamente "Mobile vs. Desktop", não o detalhe de app vs. navegador mobile.
const DEVICE_LABELS: Record<string, string> = {
  desktop: 'Desktop',
  mobile_app: 'Mobile',
  mobile_web: 'Mobile'
}

const PLACEMENT_LABELS: Record<string, string> = {
  feed: 'Feed',
  right_hand_column: 'Coluna Direita',
  instant_article: 'Instant Article',
  instream_video: 'Vídeo In-Stream',
  marketplace: 'Marketplace',
  story: 'Stories',
  reels: 'Reels',
  search: 'Busca',
  video_feeds: 'Feed de Vídeos',
  suggested_video: 'Vídeo Sugerido',
  facebook_reels: 'Reels do Facebook',
  facebook_reels_overlay: 'Overlay de Reels',
  ig_search: 'Busca do Instagram',
  explore: 'Explorar',
  explore_home: 'Explorar (Início)',
  profile_feed: 'Feed do Perfil',
  profile_reels: 'Reels do Perfil',
  rewarded_video: 'Vídeo Recompensado',
  msg: 'Mensagens',
  overlay: 'Overlay'
}

function friendlyLabel(map: Record<string, string>, raw: string): string {
  if (map[raw]) return map[raw]
  return raw
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

// Agrega uma lista de linhas já segmentadas pela própria Meta (uma por valor de breakdown,
// já somada no período inteiro) por um campo de rótulo, aplicando um dicionário de rótulo
// amigável opcional. Usado por plataforma/posicionamento/idade — mesma lógica de país, só que
// reaproveitada em 3 lugares.
function aggregateByField(
  responseBody: string | undefined,
  fieldKey: string,
  labelMap?: Record<string, string>
): BreakdownRow[] {
  const totals = new Map<string, BreakdownRow>()
  const data = JSON.parse(responseBody || '{}').data || []
  for (const row of data) {
    const raw = row[fieldKey]
    if (!raw) continue
    const label = labelMap ? friendlyLabel(labelMap, raw) : raw
    const metrics = extractRowMetrics(row)
    const existing = totals.get(label)
    if (existing) {
      existing.spend += metrics.spend
      existing.impressions += metrics.impressions
      existing.clicks += metrics.clicks
      existing.conversions += metrics.conversions
      existing.conversionValues += metrics.conversionValues
    } else {
      totals.set(label, { label, ...metrics })
    }
  }
  return Array.from(totals.values()).sort((a, b) => b.conversionValues - a.conversionValues)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId') || searchParams.get('account_id')
    const datePreset = searchParams.get('datePreset') || searchParams.get('date_preset') || 'last_7d'
    const since = searchParams.get('since')
    const until = searchParams.get('until')
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    const accessToken = await resolveMetaAccessToken(request.cookies.get('fb_access_token')?.value, accountId, userId)

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
          ...(stale?.data || { country: [], hour: [], weekday: [], platform: [], placement: [], age: [], device: [] }),
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
            ...(stale?.data || { country: [], hour: [], weekday: [], platform: [], placement: [], age: [], device: [] }),
            rateLimited: true,
            retryAfterSeconds: retryAfterSecondsFor(accountId),
            message: 'Limite de requisições da Meta atingido para esta conta. Aguarde antes de tentar novamente.'
          },
          { status: 429 }
        )
      }

      const [countryRes, hourRes, dailyRes, platformRes, placementRes, ageRes, deviceRes] = responses

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

      // Plataforma/Posicionamento/Idade — mesmo princípio de País: uma linha por valor de
      // breakdown, já agregada no período inteiro pela própria Meta. Loga o corpo do erro (em
      // vez de só cair silenciosamente pra lista vazia) pra facilitar diagnosticar uma próxima
      // dimensão que a Meta rejeitar/mudar de comportamento — foi assim que percebemos que
      // platform_position sozinho vinha vazio.
      if (platformRes.code !== 200) console.error('❌ Erro no breakdown de plataforma:', platformRes.body)
      if (placementRes.code !== 200) console.error('❌ Erro no breakdown de posicionamento:', placementRes.body)
      if (ageRes.code !== 200) console.error('❌ Erro no breakdown de idade:', ageRes.body)
      if (deviceRes.code !== 200) console.error('❌ Erro no breakdown de dispositivo:', deviceRes.body)

      const platform = platformRes.code === 200
        ? aggregateByField(platformRes.body, 'publisher_platform', PLATFORM_LABELS)
        : []
      const placement = placementRes.code === 200
        ? aggregateByField(placementRes.body, 'platform_position', PLACEMENT_LABELS)
        : []
      const age = ageRes.code === 200
        ? aggregateByField(ageRes.body, 'age')
        : []
      // device_platform (Mobile vs. Desktop) — suportado sozinho pela Meta, sem precisar
      // combinar com publisher_platform como aconteceu com posicionamento/dispositivo específico.
      const device = deviceRes.code === 200
        ? aggregateByField(deviceRes.body, 'device_platform', DEVICE_LABELS)
        : []

      const result = { country, hour, weekday: weekdayTotals, platform, placement, age, device }

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
