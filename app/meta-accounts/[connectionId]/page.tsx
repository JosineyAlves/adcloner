'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Building2, Plus, Search, RefreshCw } from 'lucide-react'
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
  connectionId: string
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

// account_status é um enum numérico da Graph API (ver seção 30 do doc do projeto): só 1 =
// ACTIVE conta como "Ativa"; qualquer outro valor (2=DISABLED, 3=UNSETTLED, 7/8/9/100/101 etc.)
// vira "Restrita" — mesmo critério binário já usado em AccountsTable.tsx no Meta Business.
function getMetaStatusLabel(accountStatus: number | null): { label: string; className: string } {
  if (accountStatus === 1) {
    return { label: 'Ativa', className: 'text-green-600 dark:text-green-400' }
  }
  if (accountStatus === null || accountStatus === undefined) {
    return { label: '—', className: 'text-gray-400' }
  }
  return { label: 'Restrita', className: 'text-red-600 dark:text-red-400' }
}

// Tela "Contas" de um perfil específico — chegou aqui pelo botão "Ver Contas" de um card em
// app/meta-accounts/page.tsx. Mostra só as contas de anúncio descobertas para ESTE perfil
// (filtradas client-side por connectionId, já que /api/meta/accounts retorna tudo de uma vez).
//
// Toggle "HABILITADA"/"DESABILITADA" por conta (e "Ativar Todas"/"Desativar Todas" em lote):
// desligar uma conta aqui marca sync_enabled=false no Supabase, e a partir da seção 42 do doc do
// projeto isso também faz o Meta Business e o Dashboard pararem de buscar/contabilizar aquela
// conta (via /api/meta/accounts?enabledOnly=true, usado pelo AppContext) — não é só um filtro
// visual nesta tela, afeta de fato o que as outras telas puxam da Meta.
export default function ConnectionAccountsPage() {
  const params = useParams<{ connectionId: string }>()
  const connectionId = params?.connectionId

  const [connection, setConnection] = useState<ConnectionSummary | null>(null)
  const [accounts, setAccounts] = useState<AdAccountSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [togglingAll, setTogglingAll] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')

  const loadData = async (isBackground = false) => {
    if (!connectionId) return
    if (isBackground) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    try {
      const [connectionsRes, accountsRes] = await Promise.all([
        fetch('/api/meta/connections'),
        fetch('/api/meta/accounts'),
      ])
      const connectionsData = await connectionsRes.json()
      const accountsData = await accountsRes.json()

      if (connectionsData.success) {
        const found = (connectionsData.connections as ConnectionSummary[]).find((c) => c.id === connectionId)
        setConnection(found ?? null)
      }
      if (accountsData.success) {
        const scoped = (accountsData.accounts as AdAccountSummary[]).filter(
          (a) => a.connectionId === connectionId
        )
        setAccounts(scoped)
      }
    } catch (error) {
      console.error('Erro ao carregar contas do perfil:', error)
      toast.error('Erro ao carregar contas de anúncio')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionId])

  const filteredAccounts = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return accounts
    return accounts.filter(
      (a) =>
        (a.name || '').toLowerCase().includes(term) ||
        a.metaAccountId.toLowerCase().includes(term)
    )
  }, [accounts, search])

  const allSyncEnabled = useMemo(
    () => accounts.length > 0 && accounts.every((a) => a.syncEnabled),
    [accounts]
  )
  const noneSyncEnabled = useMemo(
    () => accounts.length > 0 && accounts.every((a) => !a.syncEnabled),
    [accounts]
  )

  const handleSetAll = async (next: boolean) => {
    setTogglingAll(true)
    const previous = accounts
    setAccounts((prev) => prev.map((a) => ({ ...a, syncEnabled: next })))
    try {
      // A rota PATCH /api/meta/accounts só suporta uma conta por vez ou "todas as contas do
      // AdCloner inteiro" — não existe um filtro por perfil no backend, então "Ativar
      // Todas"/"Desativar Todas" aqui dispara um PATCH por conta deste perfil especificamente.
      const results = await Promise.all(
        previous.map((acc) =>
          fetch('/api/meta/accounts', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: acc.id, syncEnabled: next }),
          }).then((r) => r.json())
        )
      )
      if (results.some((r) => !r.success)) throw new Error('Falha ao atualizar uma ou mais contas')
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

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <Link
            href="/meta-accounts"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Integrações
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {connection ? connection.fbUserName || connection.fbUserId : 'Perfil'}
          </h1>
          {connection && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Conectado em {new Date(connection.createdAt).toLocaleString('pt-BR')} · {accounts.length} conta(s) de anúncio
            </p>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Carregando...
            </div>
          ) : !connection ? (
            <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-10 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Perfil não encontrado. Ele pode ter sido removido.
              </p>
            </div>
          ) : (
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Contas de anúncio
                </h2>

                {accounts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetAll(true)}
                      disabled={togglingAll || allSyncEnabled}
                      className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Ativar Todas
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAll(false)}
                      disabled={togglingAll || noneSyncEnabled}
                      className="px-3 py-1.5 text-sm rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Desativar Todas
                    </button>
                    <button
                      type="button"
                      onClick={() => loadData(true)}
                      disabled={refreshing}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                      Atualizar contas
                    </button>
                  </div>
                )}
              </div>

              {accounts.length > 0 && (
                <div className="relative mb-4 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Localizar Conta de Anúncio"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              {accounts.length === 0 ? (
                <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-10 text-center">
                  <Building2 className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Nenhuma conta de anúncio descoberta ainda para este perfil.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Reconectar perfil
                  </button>
                </div>
              ) : filteredAccounts.length === 0 ? (
                <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-10 text-center">
                  <p className="text-gray-500 dark:text-gray-400">Nenhuma conta encontrada para "{search}".</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredAccounts.map((acc) => {
                    const metaStatus = getMetaStatusLabel(acc.accountStatus)
                    return (
                      <div
                        key={acc.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/40"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {acc.name || acc.metaAccountId}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            ID da Conta: {acc.metaAccountId}
                            {acc.businessName ? ` · ${acc.businessName}` : ''} · {acc.currency || '—'}
                          </div>
                          <div className="text-xs mt-0.5">
                            <span className="text-gray-400">Meta Ads Status: </span>
                            <span className={`font-medium ${metaStatus.className}`}>{metaStatus.label}</span>
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full flex-shrink-0 hidden sm:inline-block ${
                            acc.relationship === 'owned'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                          }`}
                        >
                          {acc.relationship === 'owned' ? 'Própria' : 'Cliente'}
                        </span>
                        <span className="text-xs text-gray-400 whitespace-nowrap hidden md:inline">
                          {acc.lastSyncedAt ? new Date(acc.lastSyncedAt).toLocaleString('pt-BR') : 'Ainda não sincronizada'}
                        </span>
                        <label className="flex items-center gap-2 flex-shrink-0 cursor-pointer select-none">
                          <span
                            className={`text-xs font-semibold whitespace-nowrap ${
                              acc.syncEnabled
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-500 dark:text-red-400'
                            }`}
                          >
                            {acc.syncEnabled ? 'HABILITADA' : 'DESABILITADA'}
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={acc.syncEnabled}
                            onClick={() => handleToggleOne(acc)}
                            disabled={togglingId === acc.id}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                              acc.syncEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                acc.syncEnabled ? 'translate-x-4' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </label>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}
        </main>

        <ConnectFacebookModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            toast.success('Buscando estrutura de Business Manager...')
            setIsModalOpen(false)
            setTimeout(loadData, 3000)
          }}
        />
      </div>
    </div>
  )
}
