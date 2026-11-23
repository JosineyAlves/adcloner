import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import {
  findUserByToken, flattenPayload, parseSalePostback, parseCheckoutPostback, checkoutMessage, checkoutRecentlyNotified, saveSale, sendPushToUser, saleMessage,
  isSalesNotifyUser, logPostback,
} from '@/lib/sales-notifications'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Destino do POSTBACK de venda da H&W (Integrações > Postback > "Pedido concluído").
// /api/postbacks é rota pública no middleware — a proteção é o token secreto na URL (um por
// usuário, gerado na aba Notificações). Aceita POST (JSON ou form) e GET (querystring).
// Responde 200 mesmo para eventos ignorados, para a H&W não ficar reenviando.
// TUDO o que chega é registrado em hw_postback_log (sem dados pessoais), com o resultado do
// processamento — serve para entender o formato real dos dados (ver aba Notificações).
async function handle(request: NextRequest, { params }: { params: { token: string } }) {
  const userId = await findUserByToken(params.token)
  if (!userId) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const payload: Record<string, string> = {}
  const meta = {
    method: request.method,
    contentType: request.headers.get('content-type'),
    userAgent: request.headers.get('user-agent'),
  }

  try {
    request.nextUrl.searchParams.forEach((v, k) => { payload[k.toLowerCase()] = v })

    if (request.method === 'POST') {
      const text = await request.text()
      if (text) {
        let parsed: unknown = null
        if ((meta.contentType || '').includes('application/x-www-form-urlencoded')) {
          parsed = Object.fromEntries(new URLSearchParams(text))
        } else {
          try { parsed = JSON.parse(text) } catch { parsed = Object.fromEntries(new URLSearchParams(text)) }
        }
        Object.assign(payload, flattenPayload(parsed))
      }
    }

    if (!(await isSalesNotifyUser(userId))) {
      return NextResponse.json({ ok: true, ignored: 'not allowed' })
    }

    const sale = parseSalePostback(payload)
    if (!sale.isSale) {
      // IC (checkout iniciado): só notifica (para testes) — NOTIFY_CHECKOUT=0 desliga. Não grava em hw_sales.
      const ic = parseCheckoutPostback(payload)
      if (ic.isCheckout && process.env.NOTIFY_CHECKOUT !== '0') {
        if (await checkoutRecentlyNotified(userId, ic.hcid)) {
          await logPostback(userId, { ...meta, payload, outcome: 'IC repetido (mesma sessão, <30 min): sem nova notificação' })
          return NextResponse.json({ ok: true, checkout: true, duplicate: true })
        }
        const r = await sendPushToUser(userId, checkoutMessage(ic.offerTitle, `ic-${Date.now()}`))
        await logPostback(userId, { ...meta, payload, outcome: `IC notificado · push: ${r.sent} enviado(s), ${r.failed} falha(s)` })
        return NextResponse.json({ ok: true, checkout: true, push: r })
      }
      await logPostback(userId, { ...meta, payload, outcome: 'ignorado: não é evento de venda' })
      return NextResponse.json({ ok: true, ignored: 'not a sale event' })
    }

    // Sem nº do pedido, usa um hash do conteúdo para ainda assim evitar duplicar reenvios.
    const orderNumber =
      sale.orderNumber || 'h' + createHash('sha1').update(JSON.stringify(sale.raw)).digest('hex').slice(0, 16)

    const isNew = await saveSale(userId, sale, orderNumber)
    if (!isNew) {
      await logPostback(userId, { ...meta, payload, orderNumber, outcome: 'duplicado (reenvio)' })
      return NextResponse.json({ ok: true, duplicate: true })
    }

    const result = await sendPushToUser(userId, saleMessage(sale, `sale-${orderNumber}`))
    await logPostback(userId, {
      ...meta, payload, orderNumber,
      outcome: `venda registrada · push: ${result.sent} enviado(s), ${result.failed} falha(s)`,
    })
    return NextResponse.json({ ok: true, push: result })
  } catch (err: any) {
    console.error('[postback hw] erro:', err)
    await logPostback(userId, { ...meta, payload, outcome: `erro: ${String(err?.message || err)}` })
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
