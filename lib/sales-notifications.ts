/**
 * Notificações de venda (recurso restrito, liberado só para e-mails em SALES_NOTIFY_EMAILS).
 *
 * Fluxo: a H&W envia um POSTBACK de venda ("Pedido concluído") para /api/postbacks/hw/<token>;
 * a rota grava a venda (sem dados pessoais do comprador) e dispara um Web Push para os aparelhos
 * que ativaram a notificação na aba "Notificações" — no estilo da Hotmart:
 * título "Venda realizada", corpo "Sua comissão: US$ X,XX" (sem nº do pedido nem forma de pagamento).
 *
 * COMO REMOVER: ver sql/sales-notifications-remove.sql.
 *
 * ⚠️ Server-only (service_role key + chave privada VAPID).
 */

import { randomBytes } from 'crypto'
import { setVapidDetails, sendNotification } from 'web-push'
import { getSupabaseAdmin } from './supabase-admin'

export interface HwSale {
  id: string
  order_number: string
  received_at: string
  currency: string | null
  commission_cents: number | null
  payout_raw: string | null
  product_name: string | null
  campaign_id: string | null
  campaign_name: string | null
  adset_id: string | null
  adset_name: string | null
  ad_id: string | null
  ad_name: string | null
  placement: string | null
  is_test: boolean
}

export async function isSalesNotifyUser(userId: string): Promise<boolean> {
  const allowed = (process.env.SALES_NOTIFY_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (allowed.length === 0) return false
  const { data } = await getSupabaseAdmin().auth.admin.getUserById(userId)
  const email = data?.user?.email?.toLowerCase()
  return !!email && allowed.includes(email)
}

// ---- Token da URL do postback -----------------------------------------------------------------

export async function getOrCreateToken(userId: string): Promise<string> {
  const db = getSupabaseAdmin()
  const { data } = await db.from('hw_integrations').select('token').eq('user_id', userId).maybeSingle()
  if (data?.token) return data.token
  const token = randomBytes(24).toString('hex')
  const { error } = await db.from('hw_integrations').insert({ user_id: userId, token })
  if (error) {
    // corrida: outra requisição criou primeiro
    const again = await db.from('hw_integrations').select('token').eq('user_id', userId).maybeSingle()
    if (again.data?.token) return again.data.token
    throw new Error(error.message)
  }
  return token
}

export async function rotateToken(userId: string): Promise<string> {
  const token = randomBytes(24).toString('hex')
  const { error } = await getSupabaseAdmin()
    .from('hw_integrations')
    .upsert({ user_id: userId, token, created_at: new Date().toISOString() })
  if (error) throw new Error(error.message)
  return token
}

export async function findUserByToken(token: string): Promise<string | null> {
  if (!/^[a-f0-9]{48}$/.test(token)) return null
  const { data } = await getSupabaseAdmin().from('hw_integrations').select('user_id').eq('token', token).maybeSingle()
  return data?.user_id ?? null
}

// ---- Leitura do postback ----------------------------------------------------------------------

// Chaves que podem trazer dados pessoais — nunca vão para o banco (nem no "raw" de diagnóstico).
const PII_KEY = /customer|buyer|email|phone|fone|address|endereco|document|cpf|cnpj|^ip|_ip$|user_agent|latitude|longitude|affiliate|zip|cep/i

/** Achata o corpo (JSON aninhado/querystring) em { chave_minuscula: texto }. */
export function flattenPayload(input: unknown, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  if (input === null || input === undefined) return out
  if (typeof input === 'object' && !Array.isArray(input)) {
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      flattenPayload(v, prefix ? `${prefix}_${k}` : k, out)
    }
  } else if (Array.isArray(input)) {
    input.forEach((v, i) => flattenPayload(v, prefix ? `${prefix}_${i}` : String(i), out))
  } else if (prefix) {
    out[prefix.toLowerCase()] = String(input)
  }
  return out
}

function pick(p: Record<string, string>, keys: string[]): string | null {
  for (const k of keys) {
    const v = p[k]
    if (v !== undefined && v.trim() !== '') return v.trim()
  }
  return null
}

/** "NOME|ID" -> { name, id } (separa pelo ÚLTIMO "|"; ignora macros não resolvidas {{...}}). */
export function splitNameId(value: string | null): { name: string | null; id: string | null } {
  if (!value) return { name: null, id: null }
  let v = value
  try {
    v = decodeURIComponent(value.replace(/\+/g, ' '))
  } catch {
    // mantém como veio
  }
  if (v.includes('{{')) return { name: null, id: null }
  const i = v.lastIndexOf('|')
  if (i === -1) return /^\d{8,}$/.test(v.trim()) ? { name: null, id: v.trim() } : { name: v.trim() || null, id: null }
  const id = v.slice(i + 1).trim()
  const name = v.slice(0, i).trim() || null
  return { name, id: /^\d+$/.test(id) ? id : null }
}

/**
 * Converte o valor de comissão do postback em CENTAVOS.
 * Formato não verificado na H&W: inteiro puro ("1500") é tratado como centavos (padrão da H&W em
 * todo o resto), valor com ponto/vírgula ("15.00", "15,00") como unidade. O valor cru fica salvo
 * (payout_raw) e aparece no histórico para conferência.
 */
export function payoutToCents(raw: string | null): number | null {
  if (!raw) return null
  const s = raw.replace(/[^\d.,-]/g, '')
  if (!s) return null
  if (/^-?\d+$/.test(s)) return parseInt(s, 10)
  const n = parseFloat(s.includes(',') && !s.includes('.') ? s.replace(',', '.') : s.replace(/,/g, ''))
  return Number.isFinite(n) ? Math.round(n * 100) : null
}

export function formatMoney(cents: number | null, currency: string | null): string {
  const cur = (currency || 'USD').toUpperCase()
  const symbol = cur === 'USD' ? 'US$' : cur === 'BRL' ? 'R$' : cur
  if (cents === null) return `${symbol} —`
  const value = (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${symbol} ${value}`
}

export interface ParsedSale {
  isSale: boolean
  orderNumber: string | null
  currency: string | null
  payoutRaw: string | null
  commissionCents: number | null
  productName: string | null
  campaign: { name: string | null; id: string | null }
  adset: { name: string | null; id: string | null }
  ad: { name: string | null; id: string | null }
  placement: string | null
  isTest: boolean
  raw: Record<string, string>
}

export function parseSalePostback(payload: Record<string, string>): ParsedSale {
  const event = (pick(payload, ['event_type', 'event', 'type']) || '').toLowerCase()
  const status = (pick(payload, ['order_status', 'status']) || '').toLowerCase()

  // Venda = evento de compra/pedido concluído; ignora checkout/carrinho/pagamento em andamento.
  const looksLikeSale = !event || /purchase|paid|order|approved|complet|compra|venda|sale|upsell/.test(event)
  const notSale = /checkout|cart|carrinho|payment_info|pending|fail|refund|cancel|chargeback/.test(event)
  const statusOk = !status || /paid|approved|complet|conclu|aprovad|pago|success/.test(status)
  const isSale = looksLikeSale && !notSale && statusOk

  const payoutRaw = pick(payload, ['order_payout', 'order_payout_back', 'payout', 'commission', 'commission_value', 'affiliate_commission'])
  const testFlag = (pick(payload, ['is_test', 'istest', 'test']) || '').toLowerCase()

  const raw: Record<string, string> = {}
  for (const [k, v] of Object.entries(payload)) {
    if (!PII_KEY.test(k)) raw[k] = v.slice(0, 300)
  }

  return {
    isSale,
    orderNumber: pick(payload, ['order_number', 'ordernumber', 'order_id', 'order']),
    currency: pick(payload, ['order_currency', 'currency']),
    payoutRaw,
    commissionCents: payoutToCents(payoutRaw),
    productName: pick(payload, ['product_name', 'product_title', 'product', 'product_0_name']),
    campaign: splitNameId(pick(payload, ['utm_campaign'])),
    adset: splitNameId(pick(payload, ['utm_medium'])),
    ad: splitNameId(pick(payload, ['utm_content'])),
    placement: pick(payload, ['utm_term']),
    isTest: testFlag === 'true' || testFlag === '1',
    raw,
  }
}

// ---- Gravação + push --------------------------------------------------------------------------

/** Grava a venda. Retorna false se já existia (reenvio do postback) — aí não notifica de novo. */
export async function saveSale(userId: string, sale: ParsedSale, orderNumber: string): Promise<boolean> {
  const { error } = await getSupabaseAdmin().from('hw_sales').insert({
    user_id: userId,
    order_number: orderNumber,
    currency: sale.currency,
    commission_cents: sale.commissionCents,
    payout_raw: sale.payoutRaw,
    product_name: sale.productName,
    campaign_id: sale.campaign.id,
    campaign_name: sale.campaign.name,
    adset_id: sale.adset.id,
    adset_name: sale.adset.name,
    ad_id: sale.ad.id,
    ad_name: sale.ad.name,
    placement: sale.placement,
    is_test: sale.isTest,
    raw: sale.raw,
  })
  if (error) {
    if (error.code === '23505') return false
    throw new Error(error.message)
  }
  return true
}

export async function listSales(userId: string, limit = 100): Promise<HwSale[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('hw_sales')
    .select('id, order_number, received_at, currency, commission_cents, payout_raw, product_name, campaign_id, campaign_name, adset_id, adset_name, ad_id, ad_name, placement, is_test')
    .eq('user_id', userId)
    .order('received_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return (data ?? []) as HwSale[]
}

// web-push 4.x é ESM puro (só exports nomeados, sem default) — por isso import nomeado.
function configurePush(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return false
  setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:contato@vmetrics.app', pub, priv)
  return true
}

export async function countSubscriptions(userId: string): Promise<number> {
  const { count } = await getSupabaseAdmin()
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  return count ?? 0
}

export async function saveSubscription(
  userId: string,
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent: string | null
) {
  const { error } = await getSupabaseAdmin()
    .from('push_subscriptions')
    .upsert(
      { user_id: userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, user_agent: userAgent?.slice(0, 300) ?? null },
      { onConflict: 'endpoint' }
    )
  if (error) throw new Error(error.message)
}

export async function removeSubscription(userId: string, endpoint: string) {
  await getSupabaseAdmin().from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', endpoint)
}

export interface PushMessage {
  title: string
  body: string
  tag?: string
  url?: string
}

/** Envia o push a todos os aparelhos do usuário; remove assinaturas expiradas (404/410). */
export async function sendPushToUser(userId: string, message: PushMessage): Promise<{ sent: number; failed: number }> {
  if (!configurePush()) return { sent: 0, failed: 0 }
  const db = getSupabaseAdmin()
  const { data: subs } = await db.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', userId)
  let sent = 0
  let failed = 0
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(message),
          { TTL: 60 * 60 * 24, urgency: 'high' }
        )
        sent++
        await db.from('push_subscriptions').update({ last_success_at: new Date().toISOString() }).eq('id', s.id)
      } catch (err: any) {
        failed++
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await db.from('push_subscriptions').delete().eq('id', s.id)
        } else {
          console.error('[sales-notifications] push falhou:', err?.statusCode, err?.body || err?.message)
        }
      }
    })
  )
  return { sent, failed }
}

export function saleMessage(sale: Pick<ParsedSale, 'commissionCents' | 'currency' | 'isTest'>, tag: string): PushMessage {
  return {
    title: sale.isTest ? 'Venda realizada (teste)' : 'Venda realizada',
    body: `Sua comissão: ${formatMoney(sale.commissionCents, sale.currency)}`,
    tag,
    url: '/notificacoes',
  }
}
