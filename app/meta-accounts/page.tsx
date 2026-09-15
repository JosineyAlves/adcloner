'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Trash2, Loader2, Facebook, User } from 'lucide-react'
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

// Tela "Integrações" — reorganizada no estilo "Central de Contas" (perfis do Meta como cards
// pesquisáveis, cada um levando pra uma tela própria com as contas de anúncio daquele perfil em
// app/meta-accounts/[connectionId]/page.tsx). Por enquanto só a aba "Anúncios" existe de fato:
// Webhooks/UTMs/Pixel/WhatsApp não têm nenhuma funcionalidade equivalente aqui ainda.
export default function MetaAccountsPage() {
  const [connections, setConnections] = useState<ConnectionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
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
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integrações</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Abas — hoje só "Anúncios" está implementada de fato */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="flex gap-6">
              <button className="pb-3 px-1 border-b-2 border-brand-500 text-gray-900 dark:text-white text-sm font-medium">
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
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Perfis</h2>

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
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {conn.fbUserName || conn.fbUserId}
                              </p>
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
