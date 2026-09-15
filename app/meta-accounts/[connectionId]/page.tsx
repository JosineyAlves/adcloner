'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Building2, Plus } from 'lucide-react'
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

// Tela "Contas" de um perfil específico — chegou aqui pelo botão "Ver Contas" de um card em
// app/meta-accounts/page.tsx. Mostra só as contas de anúncio descobertas para ESTE perfil
// (filtradas client-side por connectionId, já que /api/meta/accounts retorna tudo de uma vez).
export default function ConnectionAccountsPage() {
  const params = useParams<{ connectionId: string }>()
  const connectionId = params?.connectionId

  const [connection, setConnection] = useState<ConnectionSummary | null>(null)
  const [accounts, setAccounts] = useState<AdAccountSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingAll, setTogglingAll] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadData = async () => {
    if (!connectionId) return
    setLoading(true)
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
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionId])

  const allSyncEnabled = useMemo(
    () => accounts.length > 0 && accounts.every((a) => a.syncEnabled),
    [accounts]
  )

  const handleToggleAll = async () => {
    const next = !allSyncEnabled
    setTogglingAll(true)
    const previous = accounts
    setAccounts((prev) => prev.map((a) => ({ ...a, syncEnabled: next })))
    try {
      // A rota PATCH /api/meta/accounts só suporta uma conta por vez ou "todas as contas do
      // AdCloner inteiro" — não existe um filtro por perfil no backend, então "Ativar todas"
      // aqui dispara um PATCH por conta deste perfil especificamente.
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
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/meta-accounts"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Integrações
          </Link>

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
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {connection.fbUserName || connection.fbUserId}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Conectado em {new Date(connection.createdAt).toLocaleString('pt-BR')} · {accounts.length} conta(s) de anúncio
                </p>
              </div>

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Contas de anúncio
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
              </section>
            </>
          )}
        </div>
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
  )
}
