'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Loader2, Building2, Plus, ChevronRight, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import Sidebar from '@/components/layout/Sidebar'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
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
  businessId: string | null
  businessName: string | null
  connectionFbUserName: string | null
  syncEnabled: boolean
  lastSyncedAt: string | null
}

interface BusinessGroup {
  // "personal" representa contas sem nenhum Business Manager associado (ver seção 1 do doc do
  // projeto — contas de anúncio pessoais do usuário, fora de qualquer BM).
  businessId: string
  businessName: string
  accounts: AdAccountSummary[]
}

// account_status é um enum numérico da Graph API (ver seção 30 do doc do projeto): só 1 =
// ACTIVE conta como "Ativa"; qualquer outro valor vira "Restrita".
function getMetaStatusLabel(accountStatus: number | null): { label: string; className: string } {
  if (accountStatus === 1) {
    return { label: 'Ativa', className: 'text-green-600 dark:text-green-400' }
  }
  if (accountStatus === null || accountStatus === undefined) {
    return { label: '—', className: 'text-gray-400' }
  }
  return { label: 'Restrita', className: 'text-red-600 dark:text-red-400' }
}

// Tela "Perfil" — chegou aqui pelo botão "Ver Contas" de um card em app/meta-accounts/page.tsx.
// Desde a seção 43 do doc do projeto, ela agrupa por Business Manager primeiro (pedido do
// usuário, pra ficar organizado igual à hierarquia real da Meta — Perfil → Business Manager →
// Contas). Desde a seção 44, em vez de cada grupo levar pra uma tela nova
// (app/meta-accounts/[connectionId]/[businessId]/page.tsx), clicar no grupo expande a lista de
// contas ali mesmo, inline, com animação — sem navegar pra outra página. A rota [businessId] foi
// mantida no código (não há como excluir arquivos remotamente), mas não é mais linkada daqui.
export default function ConnectionBusinessesPage() {
  const params = useParams<{ connectionId: string }>()
  const connectionId = params?.connectionId

  const [connection, setConnection] = useState<ConnectionSummary | null>(null)
  const [accounts, setAccounts] = useState<AdAccountSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  // Qual grupo de Business Manager está expandido no momento — só um por vez, igual a um
  // acordeão, pra manter a lista organizada mesmo com muitos BMs.
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [togglingAllId, setTogglingAllId] = useState<string | null>(null)
  const [togglingAccountId, setTogglingAccountId] = useState<string | null>(null)

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
      console.error('Erro ao carregar dados do perfil:', error)
      toast.error('Erro ao carregar Business Managers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionId])

  // Nome de exibição do grupo "personal" (contas ligadas direto ao perfil, sem Business Manager
  // por trás) — usa o nome do próprio perfil em vez de um rótulo genérico, pra ficar claro de
  // onde a conta veio, principalmente com vários perfis conectados.
  const profileLabel = connection?.fbUserName || connection?.fbUserId || 'Perfil'

  const businessGroups = useMemo<BusinessGroup[]>(() => {
    const groups = new Map<string, BusinessGroup>()
    for (const acc of accounts) {
      const key = acc.businessId || 'personal'
      const name = acc.businessId ? (acc.businessName || 'Business Manager sem nome') : `Conta pessoal de ${profileLabel}`
      if (!groups.has(key)) {
        groups.set(key, { businessId: key, businessName: name, accounts: [] })
      }
      groups.get(key)!.accounts.push(acc)
    }
    // Business Managers nomeados primeiro (ordem alfabética), "Contas sem Business Manager" por
    // último — é o grupo menos comum/mais residual, faz sentido não competir por atenção.
    return Array.from(groups.values()).sort((a, b) => {
      if (a.businessId === 'personal') return 1
      if (b.businessId === 'personal') return -1
      return a.businessName.localeCompare(b.businessName)
    })
  }, [accounts, profileLabel])

  const toggleExpanded = (businessId: string) => {
    setExpandedId((prev) => (prev === businessId ? null : businessId))
    setSearch('')
  }

  const handleToggleOne = async (account: AdAccountSummary) => {
    const next = !account.syncEnabled
    setTogglingAccountId(account.id)
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
      setTogglingAccountId(null)
    }
  }

  const handleSetAllInGroup = async (group: BusinessGroup, next: boolean) => {
    setTogglingAllId(group.businessId)
    const groupAccountIds = new Set(group.accounts.map((a) => a.id))
    const previous = accounts
    setAccounts((prev) => prev.map((a) => (groupAccountIds.has(a.id) ? { ...a, syncEnabled: next } : a)))
    try {
      const results = await Promise.all(
        group.accounts.map((acc) =>
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
      setAccounts(previous)
      loadData()
    } finally {
      setTogglingAllId(null)
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
              Conectado em {new Date(connection.createdAt).toLocaleString('pt-BR')} · {accounts.length} conta(s) de anúncio · {businessGroups.filter(g => g.businessId !== 'personal').length} Business Manager(s)
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
          ) : accounts.length === 0 ? (
            <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-10 text-center">
              <Building2 className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Nenhum Business Manager ou conta de anúncio descoberto ainda para este perfil.
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
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                Business Managers
              </h2>
              {/* Lista em acordeão: clicar num grupo expande a lista de contas dele ali mesmo (com
                  animação de altura via framer-motion), em vez de navegar pra uma tela nova — só um
                  grupo aberto por vez. "Conta pessoal de {perfil}" sempre por último (ver sort
                  acima), com ícone diferente pra se distinguir visualmente de um BM real. */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                {businessGroups.map((group) => {
                  const enabledCount = group.accounts.filter((a) => a.syncEnabled).length
                  const isPersonal = group.businessId === 'personal'
                  const isExpanded = expandedId === group.businessId
                  const filteredGroupAccounts = search.trim()
                    ? group.accounts.filter((a) => {
                        const term = search.trim().toLowerCase()
                        return (a.name || '').toLowerCase().includes(term) || a.metaAccountId.toLowerCase().includes(term)
                      })
                    : group.accounts
                  const allEnabled = group.accounts.length > 0 && group.accounts.every((a) => a.syncEnabled)
                  const noneEnabled = group.accounts.length > 0 && group.accounts.every((a) => !a.syncEnabled)

                  return (
                    <div key={group.businessId}>
                      <button
                        type="button"
                        onClick={() => toggleExpanded(group.businessId)}
                        aria-expanded={isExpanded}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors text-left"
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isPersonal
                              ? 'bg-gray-100 dark:bg-gray-700'
                              : 'bg-brand-100 dark:bg-brand-500/10'
                          }`}
                        >
                          <Building2
                            className={`w-4.5 h-4.5 ${
                              isPersonal ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {group.businessName}
                          </div>
                          <div className="text-xs text-gray-400">
                            {group.accounts.length} conta{group.accounts.length === 1 ? '' : 's'} de anúncio
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 hidden sm:block">
                          <span className="text-green-600 dark:text-green-400 font-medium">{enabledCount}</span> habilitada{enabledCount === 1 ? '' : 's'}
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex-shrink-0"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                        </motion.div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            key="content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="bg-gray-50 dark:bg-gray-900/40 px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                <div className="relative max-w-xs w-full">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Localizar Conta de Anúncio"
                                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                  />
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleSetAllInGroup(group, true)}
                                    disabled={togglingAllId === group.businessId || allEnabled}
                                    className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                  >
                                    Ativar Todas
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSetAllInGroup(group, false)}
                                    disabled={togglingAllId === group.businessId || noneEnabled}
                                    className="px-2.5 py-1.5 text-xs rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                  >
                                    Desativar Todas
                                  </button>
                                </div>
                              </div>

                              {filteredGroupAccounts.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">
                                  Nenhuma conta encontrada para "{search}".
                                </p>
                              ) : (
                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                                  {filteredGroupAccounts.map((acc) => {
                                    const metaStatus = getMetaStatusLabel(acc.accountStatus)
                                    return (
                                      <div
                                        key={acc.id}
                                        className="flex items-center gap-3 px-3 py-2.5"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {acc.name || acc.metaAccountId}
                                          </div>
                                          <div className="text-xs text-gray-400 truncate">
                                            ID da Conta: {acc.metaAccountId} · {acc.currency || '—'}
                                          </div>
                                          <div className="text-xs mt-0.5">
                                            <span className="text-gray-400">Meta Ads Status: </span>
                                            <span className={`font-medium ${metaStatus.className}`}>{metaStatus.label}</span>
                                          </div>
                                        </div>
                                        <label className="flex items-center gap-2 flex-shrink-0 cursor-pointer select-none">
                                          <span
                                            className={`text-xs font-semibold whitespace-nowrap ${
                                              acc.syncEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                                            }`}
                                          >
                                            {acc.syncEnabled ? 'HABILITADA' : 'DESABILITADA'}
                                          </span>
                                          <ToggleSwitch
                                            checked={acc.syncEnabled}
                                            onChange={() => handleToggleOne(acc)}
                                            disabled={togglingAccountId === acc.id}
                                            ariaLabel={acc.syncEnabled ? 'Desabilitar sincronizacao' : 'Habilitar sincronizacao'}
                                          />
                                        </label>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
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
