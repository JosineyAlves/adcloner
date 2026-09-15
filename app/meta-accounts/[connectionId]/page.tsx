'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Building2, Plus, ChevronRight } from 'lucide-react'
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

// Tela "Perfil" — chegou aqui pelo botão "Ver Contas" de um card em app/meta-accounts/page.tsx.
// Desde a seção 43 do doc do projeto, esta tela não lista mais as contas de anúncio direto: ela
// agrupa por Business Manager primeiro (pedido do usuário, pra ficar organizado igual à
// hierarquia real da Meta — Perfil → Business Manager → Contas), e cada card "Ver Contas" leva
// pra app/meta-accounts/[connectionId]/[businessId]/page.tsx, que é quem mostra a lista de
// contas de fato (busca, toggle habilitar/desabilitar, status).
export default function ConnectionBusinessesPage() {
  const params = useParams<{ connectionId: string }>()
  const connectionId = params?.connectionId

  const [connection, setConnection] = useState<ConnectionSummary | null>(null)
  const [accounts, setAccounts] = useState<AdAccountSummary[]>([])
  const [loading, setLoading] = useState(true)
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
              {/* Lista (em vez do grid de cards anterior) — escala melhor quando o perfil tem muitos
                  Business Managers, e deixa nome/contagem alinhados numa coluna só de ler, mais fácil
                  de comparar entre os grupos. "Conta pessoal de {perfil}" sempre por último (ver sort
                  acima), já vem com um ícone diferente pra se distinguir visualmente de um BM real. */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                {businessGroups.map((group) => {
                  const enabledCount = group.accounts.filter((a) => a.syncEnabled).length
                  const isPersonal = group.businessId === 'personal'
                  return (
                    <Link
                      key={group.businessId}
                      href={`/meta-accounts/${connectionId}/${group.businessId}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors"
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isPersonal
                            ? 'bg-gray-100 dark:bg-gray-700'
                            : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}
                      >
                        <Building2
                          className={`w-4.5 h-4.5 ${
                            isPersonal ? 'text-gray-500 dark:text-gray-400' : 'text-blue-600 dark:text-blue-400'
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
                      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    </Link>
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
