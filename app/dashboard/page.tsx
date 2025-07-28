'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, DollarSign, MousePointer, Target, TrendingUp, BarChart3, RefreshCw, Calendar, Settings } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import StatsCard from '@/components/dashboard/StatsCard'
import ColumnConfigModal from '@/components/dashboard/ColumnConfigModal'
import { FacebookAccount } from '@/lib/types'
import { ColumnConfig, DEFAULT_COLUMNS, getVisibleColumns, formatColumnValue } from '@/lib/column-config'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<FacebookAccount[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [datePreset, setDatePreset] = useState<string>('last_7d')
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false)

  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (accounts.length > 0) {
      fetchInsights()
    }
  }, [accounts, datePreset])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/facebook/accounts', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts || [])
      } else if (response.status === 401) {
        window.location.href = '/login'
        return
      } else {
        console.error('Failed to fetch accounts')
        toast.error('Erro ao carregar contas do Facebook')
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
      toast.error('Erro ao carregar contas do Facebook')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchInsights = async () => {
    try {
      const activeAccounts = accounts.filter(a => a.status === 'active')
      console.log(`📊 Buscando insights de ${activeAccounts.length} contas ativas`)
      
      const allInsights = []
      for (const account of activeAccounts) {
        try {
          console.log(`🔍 Buscando insights para conta: ${account.id}`)
          const response = await fetch(`/api/insights?accountId=${account.id}&datePreset=${datePreset}`, {
            credentials: 'include'
          })
          
          if (response.ok) {
            const data = await response.json()
            console.log(`✅ Insights recebidos para ${account.id}:`, data.insights?.length || 0)
            if (data.insights && data.insights.length > 0) {
              allInsights.push(...data.insights)
            }
          } else {
            console.error(`❌ Erro ao buscar insights para ${account.id}:`, response.status)
          }
        } catch (error) {
          console.error(`Error fetching insights for account ${account.id}:`, error)
        }
      }
      
      console.log(`📈 Total de insights encontrados: ${allInsights.length}`)
      setInsights(allInsights)
    } catch (error) {
      console.error('Error fetching insights:', error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAccounts()
    setIsRefreshing(false)
    toast.success('Dashboard atualizado!')
  }

  const handleSaveColumns = (newColumns: ColumnConfig[]) => {
    setColumns(newColumns)
    toast.success('Configuração de colunas salva!')
  }

  const visibleColumns = getVisibleColumns(columns)

  // Calcular métricas agregadas dos insights
  const aggregatedMetrics = insights.reduce((acc, insight) => {
    return {
      impressions: (acc.impressions || 0) + (parseInt(insight.impressions || '0') || 0),
      clicks: (acc.clicks || 0) + (parseInt(insight.clicks || '0') || 0),
      spend: (acc.spend || 0) + (parseFloat(insight.spend || '0') || 0),
      reach: (acc.reach || 0) + (parseInt(insight.reach || '0') || 0)
    }
  }, {})

  // Calcular métricas derivadas
  const derivedMetrics = {
    cpm: aggregatedMetrics.impressions > 0 ? (aggregatedMetrics.spend / aggregatedMetrics.impressions) * 1000 : 0,
    cpc: aggregatedMetrics.clicks > 0 ? aggregatedMetrics.spend / aggregatedMetrics.clicks : 0,
    ctr: aggregatedMetrics.impressions > 0 ? (aggregatedMetrics.clicks / aggregatedMetrics.impressions) * 100 : 0
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Relatório de Performance
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Métricas de campanhas do Facebook Ads
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="today">Hoje</option>
                <option value="yesterday">Ontem</option>
                <option value="last_3d">Últimos 3 dias</option>
                <option value="last_7d">Últimos 7 dias</option>
                <option value="last_14d">Últimos 14 dias</option>
                <option value="last_28d">Últimos 28 dias</option>
                <option value="last_30d">Últimos 30 dias</option>
                <option value="last_90d">Últimos 90 dias</option>
              </select>
              <button
                onClick={() => setIsConfigModalOpen(true)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Configurar Colunas</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Status das Contas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Contas Integradas
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {accounts.length} conta(s) conectada(s) • {accounts.filter(a => a.status === 'active').length} ativa(s)
                  </p>
                </div>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Métricas Principais */}
            {insights.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <StatsCard
                      title="Impressões"
                      value={aggregatedMetrics.impressions?.toLocaleString() || '0'}
                      icon={Eye}
                  iconColor="text-blue-600"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <StatsCard
                      title="Cliques"
                      value={aggregatedMetrics.clicks?.toLocaleString() || '0'}
                      icon={MousePointer}
                  iconColor="text-green-600"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <StatsCard
                      title="Gasto"
                      value={`R$ ${aggregatedMetrics.spend?.toFixed(2) || '0.00'}`}
                      icon={DollarSign}
                      iconColor="text-red-600"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <StatsCard
                      title="Alcance"
                      value={aggregatedMetrics.reach?.toLocaleString() || '0'}
                      icon={Target}
                      iconColor="text-purple-600"
                />
              </motion.div>
            </div>

                {/* Métricas Derivadas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">CPM</span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        R$ {derivedMetrics.cpm?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Custo por mil impressões</p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">CPC</span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        R$ {derivedMetrics.cpc?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Custo por clique</p>
              </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">CTR</span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {derivedMetrics.ctr?.toFixed(2) || '0.00'}%
                      </span>
                </div>
                    <p className="text-xs text-gray-500 mt-1">Taxa de clique</p>
                  </div>
            </div>

                {/* Detalhes das Campanhas */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
              <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Detalhes das Campanhas
                        </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                          {insights.length} campanha(s) encontrada(s) • {visibleColumns.length} coluna(s) visível(is)
                          </p>
                      </div>
                      <button
                        onClick={() => setIsConfigModalOpen(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Settings className="w-4 h-4 inline mr-1" />
                        Configurar
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          {visibleColumns.map((column) => (
                            <th 
                              key={column.id}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                              {column.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {insights.slice(0, 10).map((insight, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            {visibleColumns.map((column) => (
                              <td 
                                key={column.id}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                              >
                                {formatColumnValue(insight[column.id], column)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nenhum dado encontrado
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {accounts.length === 0 
                    ? 'Conecte suas contas do Facebook para ver os dados de performance.'
                    : 'Não há dados de insights disponíveis para o período selecionado.'
                  }
                </p>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Modal de Configuração de Colunas */}
      <ColumnConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        columns={columns}
        onSave={handleSaveColumns}
      />
    </div>
  )
} 