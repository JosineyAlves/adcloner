import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/supabase/server'
import {
  isSalesNotifyUser, getOrCreateToken, rotateToken, listSales, countSubscriptions,
  saveSubscription, removeSubscription, sendPushToUser,
} from '@/lib/sales-notifications'

export const dynamic = 'force-dynamic'

// Recurso restrito (SALES_NOTIFY_EMAILS): quem não está na lista recebe { allowed: false } no GET
// (o item some do menu) e 403 nas demais ações.
async function authorize() {
  const userId = await getAuthenticatedUserId()
  if (!userId) return { userId: null, allowed: false }
  return { userId, allowed: await isSalesNotifyUser(userId) }
}

function baseUrl(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  return host ? `${proto}://${host}` : request.nextUrl.origin
}

export async function GET(request: NextRequest) {
  const { userId, allowed } = await authorize()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!allowed) return NextResponse.json({ allowed: false })
  if (request.nextUrl.searchParams.get('access') === '1') return NextResponse.json({ allowed: true })
  try {
    const [token, sales, devices] = await Promise.all([getOrCreateToken(userId), listSales(userId), countSubscriptions(userId)])
    return NextResponse.json({
      allowed: true,
      postbackUrl: `${baseUrl(request)}/api/postbacks/hw/${token}`,
      vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null,
      devices,
      sales,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST { action: 'subscribe' | 'unsubscribe' | 'test' | 'rotate-token', ... }
export async function POST(request: NextRequest) {
  const { userId, allowed } = await authorize()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!allowed) return NextResponse.json({ error: 'Recurso não liberado' }, { status: 403 })
  const body = await request.json().catch(() => null)
  try {
    switch (body?.action) {
      case 'subscribe': {
        const sub = body.subscription
        if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
          return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
        }
        await saveSubscription(userId, sub, request.headers.get('user-agent'))
        return NextResponse.json({ ok: true, devices: await countSubscriptions(userId) })
      }
      case 'unsubscribe': {
        if (typeof body.endpoint === 'string') await removeSubscription(userId, body.endpoint)
        return NextResponse.json({ ok: true, devices: await countSubscriptions(userId) })
      }
      case 'test': {
        const result = await sendPushToUser(userId, {
          title: 'Venda realizada (teste)',
          body: 'Sua comissão: US$ 10,00',
          tag: `test-${Date.now()}`,
          url: '/notificacoes',
        })
        return NextResponse.json({ ok: true, ...result })
      }
      case 'rotate-token': {
        const token = await rotateToken(userId)
        return NextResponse.json({ ok: true, postbackUrl: `${baseUrl(request)}/api/postbacks/hw/${token}` })
      }
      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
