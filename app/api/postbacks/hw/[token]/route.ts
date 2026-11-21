import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import {
  findUserByToken, flattenPayload, parseSalePostback, saveSale, sendPushToUser, saleMessage, isSalesNotifyUser,
} from '@/lib/sales-notifications'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Destino do POSTBACK de venda da H&W (Integrações > Postback > "Pedido concluído").
// /api/postbacks é rota pública no middleware — a proteção é o token secreto na URL (um por
// usuário, gerado na aba Notificações). Aceita POST (JSON ou form) e GET (querystring).
// Responde 200 mesmo para eventos ignorados, para a H&W não ficar reenviando.
async function handle(request: NextRequest, { params }: { params: { token: string } }) {
  const userId = await findUserByToken(params.token)
  if (!userId) return NextResponse.json({ error: 'not found' }, { status: 404 })

  try {
    const payload: Record<string, string> = {}
    request.nextUrl.searchParams.forEach((v, k) => { payload[k.toLowerCase()] = v })

    if (request.method === 'POST') {
      const type = request.headers.get('content-type') || ''
      const text = await request.text()
      if (text) {
        let parsed: unknown = null
        if (type.includes('application/x-www-form-urlencoded')) {
          parsed = Object.fromEntries(new URLSearchParams(text))
        } else {
          try { parsed = JSON.parse(text) } catch { parsed = Object.fromEntries(new URLSearchParams(text)) }
        }
        Object.assign(payload, flattenPayload(parsed))
      }
    }

    if (!(await isSalesNotifyUser(userId))) return NextResponse.json({ ok: true, ignored: 'not allowed' })

    const sale = parseSalePostback(payload)
    if (!sale.isSale) return NextResponse.json({ ok: true, ignored: 'not a sale event' })

    // Sem nº do pedido, usa um hash do conteúdo para ainda assim evitar duplicar reenvios.
    const orderNumber =
      sale.orderNumber || 'h' + createHash('sha1').update(JSON.stringify(sale.raw)).digest('hex').slice(0, 16)

    const isNew = await saveSale(userId, sale, orderNumber)
    if (!isNew) return NextResponse.json({ ok: true, duplicate: true })

    const result = await sendPushToUser(userId, saleMessage(sale, `sale-${orderNumber}`))
    return NextResponse.json({ ok: true, push: result })
  } catch (err: any) {
    console.error('[postback hw] erro:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
