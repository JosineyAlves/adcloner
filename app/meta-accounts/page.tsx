'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Plus, RefreshCw, Trash2, CheckCircle2, XCircle, Loader2, Zap, Clock } from 'lucide-react'
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

export default function MetaAccountsPage() {
  const [connections, setConnections] = useState<ConnectionSummary[]>([])
  const [accounts, setAccounts] = useState<AdAccountSummary[]>([])
  const [syncRuns, setSyncRuns] = useState<SyncRun[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

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
    if (!confirm('Remover esta conexão? As contas de anúncio associadas deixarão de ser sincronizadas.')) {
      return
    }
    setRemovingId(connectionId)
    try {
      const res = await fetch(`/api/meta/connections?id=${connectionId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Conexão removida')
        loadData()
      } else {
        toast.error(data.error || 'Erro ao remover conexão')
      }
    } catch (error) {
      toast.error('Erro ao remover conexão')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contas Conectadas</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Todas as contas de anúncio e Business Managers integrados ao AdCloner, salvos e prontos para análise.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadData}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </button>
              <button
                onClick={handleSyncNow}
                disabled={isSyncing || accounts.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition disabled:opacity-50"
                title="O sync automático roda 1x/dia (plano Hobby da Vercel) — use este botão pra atualizar na hora"
              >
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Sincronizar agora
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
              >
                <Plus className="w-4 h-4" />
                Conectar conta
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Carregando...
            </div>
          ) : (
            <>
              <section className="mb-10">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                  Conexões ({connections.length})
                </h2>
                {connections.length === 0 ? (
                  <EmptyState onConnect={() => setIsModalOpen(true)} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {connections.map((conn) => (
                      <motion.div
                        key={conn.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {conn.fbUserName || conn.fbUserId}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {conn.tokenType === 'system_user' ? 'System User Token' : 'Token de usuário'}
                            </p>
                          </div>
                          <StatusBadge status={conn.status} />
                        </div>
                        <div className="flex gap-4 mt-4 text-sm text-gray-600 dark:text-gray-300">
                          <span>{conn.businessCount} Business Manager(s)</span>
                          <span>{conn.adAccountCount} conta(s) de anúncio</span>
                        </div>
                        <button
                          onClick={() => handleRemove(conn.id)}
                          disabled={removingId === conn.id}
                          className="mt-4 inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          {removingId === conn.id ? 'Removendo...' : 'Remover conexão'}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                  Contas de anúncio ({accounts.length})
                </h2>
                {accounts.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Nenhuma conta de anúncio descoberta ainda. Conecte uma conta acima.
                  </p>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900/50 text-left text-gray-500 dark:text-gray-400">
                        <tr>
                          <th className="px-4 py-3 font-medium">Conta</th>
                          <th className="px-4 py-3 font-medium">Business Manager</th>
                          <th className="px-4 py-3 font-medium">Relação</th>
                          <th className="px-4 py-3 font-medium">Moeda</th>
                          <th className="px-4 py-3 font-medium">Última sincronização</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {accounts.map((acc) => (
                          <tr key={acc.id}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {acc.name || acc.metaAccountId}
                              </div>
                              <div className="text-xs text-gray-400">{acc.metaAccountId}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                              {acc.businessName || '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  acc.relationship === 'owned'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                }`}
                              >
                                {acc.relationship === 'owned' ? 'Própria' : 'Cliente'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{acc.currency || '—'}</td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                              {acc.lastSyncedAt
                                ? new Date(acc.lastSyncedAt).toLocaleString('pt-BR')
                                : 'Ainda não sincronizada'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="mt-10">
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

function StatusBadge({ status }: { status: ConnectionSummary['status'] }) {
  if (status === 'valid') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
        <CheckCircle2 className="w-4 h-4" /> Ativa
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
      <XCircle className="w-4 h-4" /> {status}
    </span>
  )
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
        Nenhuma conta conectada ainda. Conecte seu primeiro Business Manager para começar a ver dados aqui.
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
