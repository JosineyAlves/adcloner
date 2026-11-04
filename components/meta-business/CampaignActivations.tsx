'use client'

/**
 * Modal de "Ativação agendada" de campanhas + hook de acesso. Recurso restrito: o item de menu
 * "Agendar ativação" só aparece se /api/campaign-activations responder allowed=true
 * (useActivationAccess). Ver lib/campaign-activations.ts.
 */

import { useCallback, useEffect, useState } from 'react'
import { X, Clock, Trash2, Loader2, CheckCircle2, AlertCircle, MinusCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import ToggleSwitch from '@/components/ui/ToggleSwitch'

interface SelectedCampaign {
  id: string
  name: string
  account_id: string
}

interface Activation {
  id: string
  meta_campaign_id: string
  campaign_name: string | null
  activate_time: string
  days_of_week: number[]
  enabled: boolean
  last_run_at: string | null
  last_result: 'success' | 'skipped' | 'error' | null
  last_message: string | null
}

const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const hhmm = (t: string) => t.slice(0, 5)

function describeDays(days: number[]): string {
  const s = [...days].sort().join()
  if (s === '0,1,2,3,4,5,6') return 'Todos os dias'
  if (s === '1,2,3,4,5') return 'Seg a Sex'
  return [...days].sort().map(d => DAY_NAMES[d]).join(', ')
}

function formatWhen(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}

export function useActivationAccess(): boolean {
  const [allowed, setAllowed] = useState(false)
  useEffect(() => {
    fetch('/api/campaign-activations', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => setAllowed(!!d?.allowed))
      .catch(() => { /* recurso opcional: falha silenciosa */ })
  }, [])
  return allowed
}

export default function CampaignActivationsModal({
  open, onClose, selectedCampaigns
}: { open: boolean; onClose: () => void; selectedCampaigns: SelectedCampaign[] }) {
  const [items, setItems] = useState<Activation[]>([])
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [time, setTime] = useState('07:00')
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/campaign-activations', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setItems(data.activations || [])
    } catch { /* recurso opcional: falha silenciosa */ }
  }, [])

  useEffect(() => { if (open) load() }, [open, load])

  const call = async (init: RequestInit, url = '/api/campaign-activations') => {
    const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    setItems(data.activations || [])
  }

  if (!open) return null

  const handleSave = async () => {
    if (days.length === 0) return toast.error('Selecione pelo menos um dia')
    setSaving(true)
    try {
      await call({
        method: 'POST',
        body: JSON.stringify({
          activations: selectedCampaigns.map(c => ({
            campaignId: c.id, accountId: c.account_id, campaignName: c.name, activateTime: time, daysOfWeek: days
          }))
        })
      })
      toast.success(`${selectedCampaigns.length} campanha${selectedCampaigns.length === 1 ? '' : 's'} agendada${selectedCampaigns.length === 1 ? '' : 's'}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (a: Activation) => {
    setBusyId(a.id)
    try { await call({ method: 'PATCH', body: JSON.stringify({ id: a.id, enabled: !a.enabled }) }) }
    catch (err: any) { toast.error(err.message) }
    finally { setBusyId(null) }
  }

  const handleDelete = async (a: Activation) => {
    if (!window.confirm(`Remover o agendamento de "${a.campaign_name || a.meta_campaign_id}"?`)) return
    setBusyId(a.id)
    try { await call({ method: 'DELETE' }, `/api/campaign-activations?id=${a.id}`) }
    catch (err: any) { toast.error(err.message) }
    finally { setBusyId(null) }
  }

  const icon = (r: Activation['last_result']) =>
    r === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
      : r === 'error' ? <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
      : <MinusCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => onClose()}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Ativação agendada</h2>
              </div>
              <button onClick={() => onClose()} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Fechar">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4 space-y-6">
              {selectedCampaigns.length > 0 && (
                <section className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Agendar {selectedCampaigns.length} campanha{selectedCampaigns.length === 1 ? '' : 's'} selecionada{selectedCampaigns.length === 1 ? '' : 's'}
                  </p>
                  <label className="block">
                    <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ativar às</span>
                    <input
                      type="time" value={time} onChange={e => setTime(e.target.value)}
                      className="w-40 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-ds-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </label>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nos dias</span>
                    <div className="flex gap-1.5">
                      {DAYS.map((label, d) => (
                        <button
                          key={d} type="button" title={DAY_NAMES[d]}
                          onClick={() => setDays(p => (p.includes(d) ? p.filter(x => x !== d) : [...p, d]))}
                          className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${
                            days.includes(d)
                              ? 'bg-brand-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >{label}</button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Horário de Brasília. Só ativa a campanha se ela estiver pausada naquele horário — se já estiver ativa, não faz nada. Não pausa nada.
                  </p>
                  <div className="flex justify-end">
                    <button
                      onClick={handleSave} disabled={saving}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-ds-md transition-colors"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Salvar agendamento
                    </button>
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Campanhas agendadas</h3>
                {items.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                    Nenhuma campanha agendada. Selecione campanhas na tabela e abra este painel de novo.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                    {items.map(a => (
                      <li key={a.id} className="flex items-start gap-3 px-3 py-2.5">
                        <div className="pt-0.5">
                          <ToggleSwitch
                            checked={a.enabled} onChange={() => handleToggle(a)}
                            loading={busyId === a.id} disabled={busyId === a.id} size="sm"
                            title={a.enabled ? 'Desligar agendamento' : 'Ligar agendamento'}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={a.campaign_name || ''}>
                            {a.campaign_name || a.meta_campaign_id}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Ativa às {hhmm(a.activate_time)} · {describeDays(a.days_of_week)}
                          </p>
                          {a.last_result && (
                            <p className="flex items-center gap-1 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                              {icon(a.last_result)}
                              <span className="truncate" title={a.last_message || ''}>{formatWhen(a.last_run_at)} — {a.last_message}</span>
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(a)} disabled={busyId === a.id} title="Remover agendamento"
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
