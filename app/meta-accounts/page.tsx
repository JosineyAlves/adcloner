'use client'

import { useEffect, useState } from 'react'
import { Building2, Plus, Trash2, CheckCircle2, XCircle, Loader2, Zap, Clock, Facebook } from 'lucide-react'
import toast from 'react-hot-toast'
import Sidebar from '@/components/layout/Sidebar'
import ConnectFacebookModal from '@/components/accounts/ConnectFacebookModal'

interface ConnectionSummary {
  id: string
  fbUserId: string
  fbUserName: string | null
  fbUserEmail: string | null
  tokenType: 'user' | 'system_user'
  status: 'valid' | 'expired' | 'revoked' | 'error'
  createdAt: string
  businessCount: number
  adAccountCount: number
}

interface AdAccountSummary {
  id: string
  metaAccountId: string
  name: string | null
  currency: string | null
  accountStatus: number | null
  relationship: 'owned' | 'client'
  businessName: string | null
  connectionFbUserName: string | null
  syncEnabled: boolean
  lastSyncedAt: string | null
}

interface SyncRun {
  id: string
  scope: string
  status: 'running' | 'success' | 'failed'
  started_at: string
  finished_at: string | null
  records_synced: number | null
  error: string | null
  meta_ad_accounts: { meta_account_id: string; name: string | null } | null
}

// Tela "Integrações" — layout inspirado no painel de Integrações da UTMify (cards de
// plataforma + lista de contas de anúncio com checkbox), mantendo a paleta clara já usada no
// resto do AdCloner. Por enquanto só a aba "Anúncios" existe de fato: Webhooks/UTMs/Pixel/
// WhatsApp da UTMify não têm nenhuma funcionalidade equivalente aqui ainda.
export default function MetaAccountsPage() {
  const [connections, setConnections] = useState<ConnectionSummary[]>([])
  const [accounts, setAccounts] = useState<AdAccountSummary[]>([])
  const [syncRuns, setSyncRuns] = useState<SyncRun[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [togglingAll, setTogglingAll] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [connectionsRes, accountsRes, syncRes] = await Promise.all([
        fetch('/api/meta/connections'),
        fetch('/api/meta/accounts'),
        fetch('/api/meta/sync'),
      ])
      const connectionsData = await connectionsRes.json()
      const accountsData = await accountsRes.json()
      const syncData = await syncRes.json()

      if (connectionsData.success) setConnections(connectionsData.connections)
      if (accountsData.success) setAccounts(accountsData.accounts)
      if (syncData.success) setSyncRuns(syncData.runs)
    } catch (error) {
      console.error('Erro ao carregar dados Meta:', error)
      toast.error('Erro ao carregar contas conectadas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSyncNow = async () => {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/meta/sync', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        const okCount = data.results.filter((r: any) => r.status === 'success').length
        const skipped = data.results.filter((r: any) => r.status === 'skipped').length
        toast.success(
          `Sincronização concluída: ${okCount} conta(s) atualizada(s)${skipped ? `, ${skipped} pulada(s) por rate limit` : ''}`
        )
      } else {
        toast.error(data.error || 'Erro ao sincronizar')
      }
      loadData()
    } catch (error) {
      toast.error('Erro ao sincronizar')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleConnectSuccess = () => {
    // Importante: não fechar o modal aqui. O próprio ConnectFacebookModal já se fecha
    // sozinho (setTimeout de 2s) depois de mostrar o estado de sucesso. Fechá-lo também
    // aqui criava uma corrida entre dois unmounts simultâneos do modal animado (Framer
    // Motion) e quebrava o DOM (erro "Failed to execute removeChild").
    toast.success('Buscando estrutura de Business Manager...')
    // Dá tempo pro backend terminar a descoberta antes de recarregar
    setTimeout(loadData, 3000)
  }

  const handleRemove = async (connectionId: string) => {
    if (!confirm('Remover este perfil? As contas de anúncio associadas deixarão de ser sincronizadas.')) {
      return
    }
    setRemovingId(connectionId)
    try {
      const res = await fetch(`/api/meta/connections?id=${connectionId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Perfil removido')
        loadData()
      } else {
        toast.error(data.error || 'Erro ao remover perfil')
      }
    } catch (error) {
      toast.error('Erro ao remover perfil')
    } finally {
      setRemovingId(null)
    }
  }

  const allSyncEnabled = accounts.length > 0 && accounts.every((a) => a.syncEnabled)

  const handleToggleAll = async () => {
    const next = !allSyncEnabled
    setTogglingAll(true)
    setAccounts((prev) => prev.map((a) => ({ ...a, syncEnabled: next })))
    try {
      const res = await fetch('/api/meta/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true, syncEnabled: next }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
    } catch (error) {
      toast.error('Erro ao atualizar as contas')
      loadData()
    } finally {
      setTogglingAll(false)
    }
  }

  const handleToggleOne = async (account: AdAccountSummary) => {
    const next = !account.syncEnabled
    setTogglingId(account.id)
    setAccounts((prev) => prev.map((a) => (a.id === account.id ? { ...a, syncEnabled: next } : a)))
    try {
      const res = await fetch('/api/meta/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: account.id, syncEnabled: next }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
    } catch (error) {
      toast.error('Erro ao atualizar a conta')
      loadData()
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integrações</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Conecte perfis de anúncio e escolha quais contas sincronizar com o AdCloner.
            </p>
          </div>

          {/* Abas — hoje só "Anúncios" está implementada de fato */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="flex gap-6">
              <button className="pb-3 px-1 border-b-2 border-primary-600 text-primary-600 dark:text-primary-400 text-sm font-medium">
                Anúncios
              </button>
            </nav>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Carregando...
            </div>
          ) : (
            <>
              {/* Cards de plataforma */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <Facebook className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Meta Ads</h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Conecte seus perfis por aqui:</p>

                  <div className="space-y-2 mb-4">
                    {connections.length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum perfil conectado ainda.</p>
                    ) : (
                      connections.map((conn) => (
                        <div
                          key={conn.id}
                          className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/40 rounded-lg px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                              {conn.fbUserName || conn.fbUserId}
                            </p>
                            <p className="text-xs text-gray-400">
                              {conn.adAccountCount} conta(s) · <StatusLabel status={conn.status} />
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemove(conn.id)}
                            disabled={removingId === conn.id}
                            title="Remover perfil"
                            className="text-gray-400 hover:text-red-500 disabled:opacity-50 flex-shrink-0 ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar perfil
                  </button>
                </div>

                {/* Google Ads — ainda não implementado no AdCloner; card mantém o mesmo layout,
                    mas desabilitado, preparando o terreno pra quando existir. */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 opacity-60">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white text-xs font-bold">
                      G
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Google Ads</h3>
                    <span className="ml-auto text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                      Em breve
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Conecte seus perfis por aqui:</p>
                  <button
                    disabled
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar perfil
                  </button>
                </div>
              </div>

              {/* Contas de anúncio descobertas — escolha quais sincronizar */}
              <section className="mb-10">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Contas de anúncio (Meta){accounts.length > 0 ? ` (${accounts.length})` : ''}
                  </h2>
                  {accounts.length > 0 && (
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                      Ativar todas
                      <button
                        type="button"
                        role="switch"
                        aria-checked={allSyncEnabled}
                        onClick={handleToggleAll}
                        disabled={togglingAll}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                          allSyncEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            allSyncEnabled ? 'translate-x-4' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </label>
                  )}
                </div>

                {accounts.length === 0 ? (
                  <EmptyState onConnect={() => setIsModalOpen(true)} />
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                    {accounts.map((acc) => (
                      <label
                        key={acc.id}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/40"
                      >
                        <input
                          type="checkbox"
                          checked={acc.syncEnabled}
                          onChange={() => handleToggleOne(acc)}
                          disabled={togglingId === acc.id}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {acc.name || acc.metaAccountId}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {acc.metaAccountId}
                            {acc.businessName ? ` · ${acc.businessName}` : ''} · {acc.currency || '—'}
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                            acc.relationship === 'owned'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                          }`}
                        >
                          {acc.relationship === 'owned' ? 'Própria' : 'Cliente'}
                        </span>
                        <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:inline">
                          {acc.lastSyncedAt ? new Date(acc.lastSyncedAt).toLocaleString('pt-BR') : 'Ainda não sincronizada'}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {accounts.length > 0 && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={handleSyncNow}
                      disabled={isSyncing}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition disabled:opacity-50 text-sm"
                      title="O sync automático roda 1x/dia (plano Hobby da Vercel) — use este botão pra atualizar na hora"
                    >
                      {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      Sincronizar agora
                    </button>
                  </div>
                )}
              </section>

              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                  Histórico de sincronizações
                </h2>
                {syncRuns.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Nenhuma sincronização executada ainda. Clique em "Sincronizar agora" ou aguarde o cron diário
                    (roda 1x/dia às 06:00 UTC, limite do plano Hobby da Vercel).
                  </p>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900/50 text-left text-gray-500 dark:text-gray-400">
                        <tr>
                          <th className="px-4 py-3 font-medium">Conta</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Registros</th>
                          <th className="px-4 py-3 font-medium">Início</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {syncRuns.map((run) => (
                          <tr key={run.id}>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                              {run.meta_ad_accounts?.name || run.meta_ad_accounts?.meta_account_id || '—'}
                            </td>
                            <td className="px-4 py-3">
                              <SyncStatusBadge status={run.status} error={run.error} />
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                              {run.records_synced ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(run.started_at).toLocaleString('pt-BR')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      <ConnectFacebookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleConnectSuccess}
      />
    </div>
  )
}

function StatusLabel({ status }: { status: ConnectionSummary['status'] }) {
  if (status === 'valid') {
    return <span className="text-green-600 dark:text-green-400">Ativo</span>
  }
  return <span className="text-red-600 dark:text-red-400">{status}</span>
}

function SyncStatusBadge({ status, error }: { status: SyncRun['status']; error: string | null }) {
  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
        <CheckCircle2 className="w-4 h-4" /> Sucesso
      </span>
    )
  }
  if (status === 'running') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Em andamento
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400" title={error ?? ''}>
      <XCircle className="w-4 h-4" /> Falhou
    </span>
  )
}

function EmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-10 text-center">
      <Building2 className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        Nenhuma conta de anúncio descoberta ainda. Conecte um perfil acima para começar a ver dados aqui.
      </p>
      <button
        onClick={onConnect}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
      >
        <Plus className="w-4 h-4" />
        Conectar conta
      </button>
    </div>
  )
}
