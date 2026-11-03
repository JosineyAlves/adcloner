'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { X, Clock, Trash2, Loader2, CheckCircle2, AlertCircle, MinusCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import ToggleSwitch from '@/components/ui/ToggleSwitch'

export interface SchedulableCampaign {
  id: string
  name: string
  account_id: string
}

interface Schedule {
  id: string
  meta_campaign_id: string
  meta_account_id: string
  campaign_name: string | null
  pause_time: string
  activate_time: string
  days_of_week: number[]
  timezone: string
  enabled: boolean
  paused_by_schedule: boolean
  last_action: 'pause' | 'activate' | null
  last_action_at: string | null
  last_result: 'success' | 'skipped' | 'error' | null
  last_message: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  /** Campanhas selecionadas na tabela — se houver, mostra o formulário de agendamento no topo. */
  selectedCampaigns: SchedulableCampaign[]
  /** Chamado depois de salvar/remover, para o pai atualizar o indicador de "agendada". */
  onChanged?: (campaignIds: Set<string>) => void
}

const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

const hhmm = (t: string) => t.slice(0, 5)

function describeDays(days: number[]): string {
  const sorted = [...days].sort()
  if (sorted.length === 7) return 'Todos os dias'
  if (sorted.join() === '1,2,3,4,5') return 'Seg a Sex'
  if (sorted.join() === '0,6') return 'Fins de semana'
  return sorted.map(d => DAY_NAMES[d]).join(', ')
}

function formatWhen(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function CampaignSchedulesModal({ open, onClose, selectedCampaigns, onChanged }: Props) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [pauseTime, setPauseTime] = useState('00:00')
  const [activateTime, setActivateTime] = useState('07:00')
  const [days, setDays] = useState<number[]>(ALL_DAYS)

  const publish = useCallback((list: Schedule[]) => {
    setSchedules(list)
    onChanged?.(new Set(list.filter(s => s.enabled).map(s => s.meta_campaign_id)))
  }, [onChanged])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/campaign-schedules', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      publish(data.schedules)
    } catch (err: any) {
      toast.error(`Erro ao carregar agendamentos: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [publish])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  // Se só uma campanha selecionada já tem agendamento, pré-preenche o formulário com ele.
  useEffect(() => {
    if (!open || selectedCampaigns.length !== 1) return
    const existing = schedules.find(s => s.meta_campaign_id === selectedCampaigns[0].id)
    if (existing) {
      setPauseTime(hhmm(existing.pause_time))
      setActivateTime(hhmm(existing.activate_time))
      setDays(existing.days_of_week)
    }
  }, [open, selectedCampaigns, schedules])

  const alreadyScheduledCount = useMemo(
    () => selectedCampaigns.filter(c => schedules.some(s => s.meta_campaign_id === c.id)).length,
    [selectedCampaigns, schedules]
  )

  if (!open) return null

  const toggleDay = (d: number) =>
    setDays(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]))

  const handleSave = async () => {
    if (days.length === 0) {
      toast.error('Selecione pelo menos um dia')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/campaign-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedules: selectedCampaigns.map(c => ({
            campaignId: c.id,
            accountId: c.account_id,
            campaignName: c.name,
            pauseTime,
            activateTime,
            daysOfWeek: days,
            timezone: 'America/Sao_Paulo'
          }))
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      toast.success(
        `${selectedCampaigns.length} campanha${selectedCampaigns.length === 1 ? '' : 's'} agendada${selectedCampaigns.length === 1 ? '' : 's'}`
      )
      await load()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar agendamento')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (s: Schedule) => {
    setBusyId(s.id)
    try {
      const res = await fetch(`/api/campaign-schedules/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !s.enabled })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      publish(schedules.map(x => (x.id === s.id ? data.schedule : x)))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (s: Schedule) => {
    const warning = s.paused_by_schedule
      ? '\n\nAtenção: esta campanha está pausada pelo agendamento agora. Ao remover, ela NÃO será reativada automaticamente.'
      : ''
    if (!window.confirm(`Remover o agendamento de "${s.campaign_name || s.meta_campaign_id}"?${warning}`)) return
    setBusyId(s.id)
    try {
      const res = await fetch(`/api/campaign-schedules/${s.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      publish(schedules.filter(x => x.id !== s.id))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const resultIcon = (r: Schedule['last_result']) =>
    r === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
      : r === 'error' ? <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
      : <MinusCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Pausa e ativação automáticas</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Fechar">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-6">
          {selectedCampaigns.length > 0 && (
            <section className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Agendar {selectedCampaigns.length} campanha{selectedCampaigns.length === 1 ? '' : 's'} selecionada{selectedCampaigns.length === 1 ? '' : 's'}
                {alreadyScheduledCount > 0 && (
                  <span className="text-gray-400"> ({alreadyScheduledCount} já {alreadyScheduledCount === 1 ? 'tem' : 'têm'} agendamento e {alreadyScheduledCount === 1 ? 'será substituído' : 'serão substituídos'})</span>
                )}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Pausar às</span>
                  <input
                    type="time"
                    value={pauseTime}
                    onChange={e => setPauseTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-ds-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ativar às</span>
                  <input
                    type="time"
                    value={activateTime}
                    onChange={e => setActivateTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-ds-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </label>
              </div>

              <div>
                <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Pausar nos dias</span>
                <div className="flex gap-1.5">
                  {DAYS.map((label, d) => (
                    <button
                      key={d}
                      type="button"
                      title={DAY_NAMES[d]}
                      onClick={() => toggleDay(d)}
                      className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${
                        days.includes(d)
                          ? 'bg-brand-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Horário de Brasília. A campanha só é pausada se estiver ativa naquele momento, e só é reativada
                se foi o agendamento que a pausou — campanhas que você desligou manualmente continuam desligadas.
              </p>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-ds-md transition-colors"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar agendamento
                </button>
              </div>
            </section>
          )}

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Campanhas agendadas
            </h3>
            {loading && schedules.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
              </div>
            ) : schedules.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                Nenhuma campanha agendada. Selecione campanhas na tabela e use “Agendar pausa/ativação” no menu de ações em massa.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                {schedules.map(s => (
                  <li key={s.id} className="flex items-start gap-3 px-3 py-2.5">
                    <div className="pt-0.5">
                      <ToggleSwitch
                        checked={s.enabled}
                        onChange={() => handleToggle(s)}
                        loading={busyId === s.id}
                        disabled={busyId === s.id}
                        size="sm"
                        title={s.enabled ? 'Desligar agendamento' : 'Ligar agendamento'}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={s.campaign_name || ''}>
                        {s.campaign_name || s.meta_campaign_id}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Pausa {hhmm(s.pause_time)} · Ativa {hhmm(s.activate_time)} · {describeDays(s.days_of_week)}
                        {s.paused_by_schedule && <span className="ml-1 text-orange-500">· pausada pelo agendamento</span>}
                      </p>
                      {s.last_result && (
                        <p className="flex items-center gap-1 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {resultIcon(s.last_result)}
                          <span className="truncate" title={s.last_message || ''}>
                            {formatWhen(s.last_action_at)} — {s.last_message}
                          </span>
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(s)}
                      disabled={busyId === s.id}
                      title="Remover agendamento"
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
  )
}
