'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, BellOff, Copy, Loader2, RefreshCw, Send, Plug } from 'lucide-react'
import toast from 'react-hot-toast'
import Sidebar from '@/components/layout/Sidebar'
import PageHeader from '@/components/layout/PageHeader'
import { BRAZIL_TIMEZONE } from '@/lib/timezone'

// Aba "Notificações" (recurso restrito — SALES_NOTIFY_EMAILS): ativa o push de venda neste
// aparelho, mostra a URL do postback da H&W e o histórico das vendas recebidas.
// Lógica do servidor em lib/sales-notifications.ts.

interface Sale {
  id: string
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

interface PostbackEntry {
  id: string
  received_at: string
  method: string | null
  content_type: string | null
  user_agent: string | null
  event_type: string | null
  order_number: string | null
  outcome: string
  payload: Record<string, string> | null
}

interface Data {
  allowed: boolean
  postbackUrl?: string
  vapidPublicKey?: string | null
  devices?: number
  sales?: Sale[]
  postbacks?: PostbackEntry[]
}

type PushState = 'loading' | 'unsupported' | 'ios-needs-install' | 'denied' | 'off' | 'on'

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(Array.from(raw).map((c) => c.charCodeAt(0)))
}

function formatMoney(cents: number | null, currency: string | null) {
  const cur = (currency || 'USD').toUpperCase()
  const symbol = cur === 'USD' ? 'US$' : cur === 'BRL' ? 'R$' : cur
  if (cents === null) return `${symbol} —`
  return `${symbol} ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

function label(name: string | null, id: string | null) {
  if (!name && !id) return '—'
  return name || id!
}

export default function NotificacoesPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [pushState, setPushState] = useState<PushState>('loading')
  const [busy, setBusy] = useState(false)
  const [openLog, setOpenLog] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { credentials: 'include' })
      const json = await res.json()
      setData(res.ok ? json : { allowed: false })
    } catch {
      setData({ allowed: false })
    } finally {
      setLoading(false)
    }
  }, [])

  const detectPushState = useCallback(async () => {
    if (typeof window === 'undefined') return
    const ua = navigator.userAgent
    const isIOS = /iPhone|iPad|iPod/.test(ua)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setPushState(isIOS && !standalone ? 'ios-needs-install' : 'unsupported')
      return
    }
    if (Notification.permission === 'denied') return setPushState('denied')
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = await reg?.pushManager.getSubscription()
      setPushState(sub ? 'on' : 'off')
    } catch {
      setPushState('off')
    }
  }, [])

  useEffect(() => {
    load()
    detectPushState()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [load, detectPushState])

  const post = async (body: object) => {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error || 'Erro')
    return json
  }

  const enablePush = async () => {
    if (!data?.vapidPublicKey) return toast.error('Chave de push não configurada no servidor')
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setPushState(permission === 'denied' ? 'denied' : 'off')
        toast.error('Permissão de notificação não concedida')
        return
      }
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.vapidPublicKey),
        }))
      await post({ action: 'subscribe', subscription: sub.toJSON() })
      setPushState('on')
      toast.success('Notificações ativadas neste aparelho')
      load()
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível ativar')
    } finally {
      setBusy(false)
    }
  }

  const disablePush = async () => {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await post({ action: 'unsubscribe', endpoint: sub.endpoint })
        await sub.unsubscribe()
      }
      setPushState('off')
      toast.success('Notificações desativadas neste aparelho')
      load()
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao desativar')
    } finally {
      setBusy(false)
    }
  }

  const sendTest = async () => {
    setBusy(true)
    try {
      const r = await post({ action: 'test' })
      if (r.sent > 0) toast.success('Teste enviado — confira a notificação')
      else toast.error('Nenhum aparelho recebeu. Ative as notificações primeiro.')
    } catch (err: any) {
      toast.error(err?.message || 'Erro no teste')
    } finally {
      setBusy(false)
    }
  }

  const copyUrl = async () => {
    if (!data?.postbackUrl) return
    try {
      await navigator.clipboard.writeText(data.postbackUrl)
      toast.success('URL copiada')
    } catch {
      toast.error('Não foi possível copiar — selecione e copie manualmente')
    }
  }

  const rotate = async () => {
    if (!window.confirm('Gerar uma nova URL? A atual deixa de funcionar e você precisará atualizar o postback na H&W.')) return
    setBusy(true)
    try {
      const r = await post({ action: 'rotate-token' })
      setData((d) => (d ? { ...d, postbackUrl: r.postbackUrl } : d))
      toast.success('Nova URL gerada')
    } catch (err: any) {
      toast.error(err?.message || 'Erro')
    } finally {
      setBusy(false)
    }
  }

  const card = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5'
  const btn =
    'inline-flex items-center gap-2 rounded-ds-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50'

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pt-3 px-4 md:px-6 pb-6">
          <div className="space-y-4 max-w-4xl">
            <PageHeader title="Notificações" />

            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
            ) : !data?.allowed ? (
              <div className={card}>
                <p className="text-sm text-gray-600 dark:text-gray-300">Este recurso não está liberado para a sua conta.</p>
              </div>
            ) : (
              <>
                {/* 1. Push neste aparelho */}
                <section className={card}>
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Notificação neste aparelho</h2>
                  </div>

                  {pushState === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                  {pushState === 'unsupported' && (
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Este navegador não suporta notificações push. No Android use o Chrome; no iPhone, o Safari (iOS 16.4+) com o app adicionado à tela inicial.
                    </p>
                  )}
                  {pushState === 'ios-needs-install' && (
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      No iPhone o push só funciona com o vmetrics instalado na tela inicial: abra este endereço no <b>Safari</b>, toque em
                      Compartilhar → <b>Adicionar à Tela de Início</b>, abra o ícone criado e volte aqui para ativar.
                    </p>
                  )}
                  {pushState === 'denied' && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      As notificações estão bloqueadas para este site. Libere-as nas configurações do navegador/aparelho e recarregue a página.
                    </p>
                  )}
                  {(pushState === 'off' || pushState === 'on') && (
                    <div className="flex flex-wrap gap-2">
                      {pushState === 'off' ? (
                        <button onClick={enablePush} disabled={busy} className={`${btn} bg-brand-500 text-black hover:opacity-90`}>
                          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />} Ativar neste aparelho
                        </button>
                      ) : (
                        <>
                          <button onClick={sendTest} disabled={busy} className={`${btn} bg-brand-500 text-black hover:opacity-90`}>
                            <Send className="w-4 h-4" /> Enviar teste
                          </button>
                          <button onClick={disablePush} disabled={busy} className={`${btn} border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200`}>
                            <BellOff className="w-4 h-4" /> Desativar
                          </button>
                        </>
                      )}
                    </div>
                  )}

                </section>

                {/* 2. Integração H&W */}
                <section className={card}>
                  <div className="flex items-center gap-2 mb-3">
                    <Plug className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Integração com a H&W (postback de venda)</h2>
                  </div>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={data.postbackUrl || ''}
                      onFocus={(e) => e.currentTarget.select()}
                      className="flex-1 min-w-0 rounded-ds-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-xs font-mono text-gray-800 dark:text-gray-100"
                    />
                    <button onClick={copyUrl} className={`${btn} border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200`}>
                      <Copy className="w-4 h-4" /> Copiar
                    </button>
                  </div>
                  <button onClick={rotate} disabled={busy} className="mt-2 text-xs text-gray-500 dark:text-gray-400 underline">
                    Gerar nova URL
                  </button>
                </section>

                {/* 3. Histórico */}
                <section className={card}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Vendas recebidas</h2>
                    <button onClick={load} className={`${btn} border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 !py-1.5`}>
                      <RefreshCw className="w-3.5 h-3.5" /> Atualizar
                    </button>
                  </div>
                  {(data.sales ?? []).length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma venda recebida ainda.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                            <th className="py-2 pr-3 font-medium">Data (Brasília)</th>
                            <th className="py-2 pr-3 font-medium">Comissão</th>
                            <th className="py-2 pr-3 font-medium">Produto</th>
                            <th className="py-2 pr-3 font-medium">Campanha</th>
                            <th className="py-2 pr-3 font-medium">Conjunto</th>
                            <th className="py-2 pr-3 font-medium">Anúncio</th>
                            <th className="py-2 font-medium">Posição</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(data.sales ?? []).map((s) => (
                            <tr key={s.id} className="border-b border-gray-100 dark:border-gray-700/60 text-gray-800 dark:text-gray-100">
                              <td className="py-2 pr-3 whitespace-nowrap">{formatDate(s.received_at)}</td>
                              <td className="py-2 pr-3 whitespace-nowrap font-medium" title={s.payout_raw ? `valor recebido: ${s.payout_raw}` : undefined}>
                                {formatMoney(s.commission_cents, s.currency)}
                                {s.is_test && <span className="ml-1 rounded bg-gray-200 dark:bg-gray-600 px-1 text-[10px]">teste</span>}
                              </td>
                              <td className="py-2 pr-3 max-w-[160px] truncate">{s.product_name || '—'}</td>
                              <td className="py-2 pr-3 max-w-[180px] truncate" title={s.campaign_id || undefined}>{label(s.campaign_name, s.campaign_id)}</td>
                              <td className="py-2 pr-3 max-w-[180px] truncate" title={s.adset_id || undefined}>{label(s.adset_name, s.adset_id)}</td>
                              <td className="py-2 pr-3 max-w-[180px] truncate" title={s.ad_id || undefined}>{label(s.ad_name, s.ad_id)}</td>
                              <td className="py-2 whitespace-nowrap">{s.placement || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {/* 4. Registro bruto dos postbacks (diagnóstico) */}
                <section className={card}>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Postbacks recebidos (diagnóstico)</h2>
                  {(data.postbacks ?? []).length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nada recebido ainda.</p>
                  ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
                      {(data.postbacks ?? []).map((p) => (
                        <li key={p.id} className="py-2 text-xs text-gray-800 dark:text-gray-100">
                          <button
                            onClick={() => setOpenLog(openLog === p.id ? null : p.id)}
                            className="w-full text-left flex flex-wrap items-center gap-x-3 gap-y-1"
                          >
                            <span className="whitespace-nowrap text-gray-500 dark:text-gray-400">{formatDate(p.received_at)}</span>
                            <span className="font-medium">{p.event_type || '(sem event_type)'}</span>
                            <span className="text-gray-500 dark:text-gray-400">{p.method}</span>
                            {p.order_number && <span className="text-gray-500 dark:text-gray-400">pedido {p.order_number}</span>}
                            <span className="text-gray-600 dark:text-gray-300">{p.outcome}</span>
                          </button>
                          {openLog === p.id && (
                            <pre className="mt-2 max-h-72 overflow-auto rounded-ds-md bg-gray-50 dark:bg-gray-900 p-3 text-[11px] leading-relaxed whitespace-pre-wrap break-all">
{JSON.stringify({ content_type: p.content_type, user_agent: p.user_agent, campos: p.payload }, null, 2)}
                            </pre>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
