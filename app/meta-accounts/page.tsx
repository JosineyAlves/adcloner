'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Trash2, Loader2, Facebook, User, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Sidebar from '@/components/layout/Sidebar'
import PageHeader from '@/components/layout/PageHeader'
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
  restrictedAccountCount: number
}

// Tela "Integrações" — reorganizada no estilo "Central de Contas" (perfis do Meta como cards
// pesquisáveis, cada um levando pra uma tela própria com as contas de anúncio daquele perfil em
// app/meta-accounts/[connectionId]/page.tsx). As abas agora são POR PLATAFORMA de anúncio (Meta
// Ads / Google Ads), não mais uma aba genérica única — preparando terreno pra quando o Google Ads
// for integrado de verdade, ele ganha sua própria aba com perfis/contas próprias, em vez de
// disputar espaço na mesma lista da Meta. "Google Ads" fica desabilitada ("Em breve") até existir
// alguma integração real por trás dela.
export default function MetaAccountsPage() {
  const [activeTab, setActiveTab] = useState<'meta' | 'google'>('meta')
  const [connections, setConnections] = useState<ConnectionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const connectionsRes = await fetch('/api/meta/connections')
      const connectionsData = await connectionsRes.json()

      if (connectionsData.success) setConnections(connectionsData.connections)
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

  // Botão "Atualizar" — repuxa Business Managers/contas de TODAS as conexões (sequencial no
  // backend, ver lib/meta-connections.ts) pra trazer o account_status (Ativa/Restrita) mais
  // recente da Meta e detectar perfis que desconectaram ou tiveram o token expirado desde a
  // última sincronização, sem precisar remover e reconectar cada um manualmente.
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/meta/connections/refresh', { method: 'POST' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Erro ao atualizar')

      const results = data.results as { id: string; status: string }[]
      const needsReconnect = results.filter((r) => r.status === 'expired' || r.status === 'revoked').length
      const failed = results.filter((r) => r.status === 'error').length

      if (needsReconnect > 0) {
        toast.error(
          `${needsReconnect} perfil${needsReconnect === 1 ? '' : 's'} precisa${needsReconnect === 1 ? '' : 'm'} ser reconectado${needsReconnect === 1 ? '' : 's'}`
        )
      } else if (failed > 0) {
        toast.error('Alguns perfis não puderam ser atualizados agora. Tente novamente em instantes.')
      } else {
        toast.success('Contas atualizadas com sucesso')
      }
    } catch (error) {
      toast.error('Erro ao atualizar contas')
    } finally {
      setRefreshing(false)
      loadData()
    }
  }

  const filteredConnections = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return connections
    return connections.filter((c) =>
      (c.fbUserName || c.fbUserId).toLowerCase().includes(term)
    )
  }, [connections, search])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pt-3 px-4 md:px-6 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
          <div className="mb-3">
            <PageHeader title="Integrações" />
          </div>

          {/* Abas por plataforma de anúncio — cada uma terá seus próprios perfis/contas. Só
              "Meta Ads" tem integração real hoje; "Google Ads" fica reservada e desabilitada até
              existir alguma funcionalidade de verdade por trás dela. */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="flex gap-6">
              <button
                onClick={() => setActiveTab('meta')}
                className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === 'meta'
                    ? 'border-brand-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Meta Ads
              </button>
              <button
                disabled
                title="Em breve"
                className="pb-3 px-1 border-b-2 border-transparent text-gray-300 dark:text-gray-600 text-sm font-medium cursor-not-allowed flex items-center gap-2"
              >
                Google Ads
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 px-1.5 py-0.5 rounded">
                  Em breve
                </span>
              </button>
            </nav>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Carregando...
            </div>
          ) : activeTab !== 'meta' ? null : (
            <>
              {/* Card da plataforma Meta Ads */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-10 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Facebook className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Meta Ads
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium whitespace-nowrap"
                >
                  Conectar Perfil
                </button>
              </div>

              {/* Perfis conectados */}
              <section className="mb-10">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4 gap-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Perfis</h2>
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing || connections.length === 0}
                      title="Atualizar contas restritas, ativas e perfis desconectados"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                      Atualizar
                    </button>
                  </div>

                  <div className="relative mb-4">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Localizar Perfil"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/40 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {filteredConnections.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">
                      {connections.length === 0
                        ? 'Nenhum perfil conectado ainda.'
                        : 'Nenhum perfil encontrado para essa busca.'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {filteredConnections.map((conn) => (
                        <div
                          key={conn.id}
                          className="flex items-center justify-between gap-4 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 flex-wrap"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(conn.createdAt).toLocaleString('pt-BR')}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {conn.fbUserName || conn.fbUserId}
                                </p>
                                {conn.status !== 'valid' && (
                                  <span className="text-[10px] font-semibold uppercase tracking-wide bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded flex-shrink-0">
                                    {conn.status === 'expired'
                                      ? 'Token expirado'
                                      : conn.status === 'revoked'
                                      ? 'Desconectado'
                                      : 'Erro ao atualizar'}
                                  </span>
                                )}
                                {conn.restrictedAccountCount > 0 && (
                                  <span className="text-[10px] font-semibold uppercase tracking-wide bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded flex-shrink-0">
                                    {conn.restrictedAccountCount} restrita{conn.restrictedAccountCount === 1 ? '' : 's'}
                                  </span>
                                )}
                              </div>
                              {(conn.status === 'expired' || conn.status === 'revoked') && (
                                <p className="text-[11px] text-red-500 dark:text-red-400 mt-0.5">
                                  Clique em "Conectar Perfil" para reconectar este perfil.
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <Link
                              href={`/meta-accounts/${conn.id}`}
                              className="px-4 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                            >
                              Ver Contas
                            </Link>
                            <button
                              onClick={() => handleRemove(conn.id)}
                              disabled={removingId === conn.id}
                              title="Remover perfil"
                              className="text-red-500 hover:text-red-600 disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
          </motion.div>
        </main>

        <ConnectFacebookModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleConnectSuccess}
        />
      </div>
    </div>
  )
}
