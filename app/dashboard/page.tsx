'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, TrendingUp, Users, BarChart3, Copy, RefreshCw, Eye, DollarSign, MousePointer, Target } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import StatsCard from '@/components/dashboard/StatsCard'
import AccountCard from '@/components/dashboard/AccountCard'
import { FacebookAccount } from '@/lib/types'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<FacebookAccount[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [datePreset, setDatePreset] = useState<string>('last_7d')

  useEffect(() => {
    fetchAccounts()
    fetchInsights()
  }, [datePreset])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/facebook/accounts', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts || [])
      } else if (response.status === 401) {
        // Token expirado, redirecionar para login
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
      // Buscar insights de todas as contas ativas
      const activeAccounts = accounts.filter(a => a.status === 'active')
      
      const allInsights = []
      for (const account of activeAccounts) {
        try {
          const response = await fetch(`/api/insights?accountId=${account.id}&datePreset=${datePreset}`, {
            credentials: 'include'
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.insights && data.insights.length > 0) {
              allInsights.push(...data.insights)
            }
          }
        } catch (error) {
          console.error(`Error fetching insights for account ${account.id}:`, error)
        }
      }
      
      setInsights(allInsights)
    } catch (error) {
      console.error('Error fetching insights:', error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAccounts()
    await fetchInsights()
    setIsRefreshing(false)
    toast.success('Dashboard atualizado!')
  }

  // Calcular estatísticas baseadas nos dados reais e insights
  const stats = {
    totalAccounts: accounts.length,
    activeAccounts: accounts.filter(a => a.status === 'active').length,
    totalCampaigns: insights.length,
    totalClones: 0 // Será calculado quando implementarmos a API de clones
  }

  // Calcular métricas agregadas dos insights
  const aggregatedMetrics = insights.reduce((acc, insight) => {
    return {
      impressions: (acc.impressions || 0) + (parseInt(insight.impressions) || 0),
      clicks: (acc.clicks || 0) + (parseInt(insight.clicks) || 0),
      spend: (acc.spend || 0) + (parseFloat(insight.spend) || 0),
      reach: (acc.reach || 0) + (parseInt(insight.reach) || 0),
      conversions: (acc.conversions || 0) + (parseInt(insight.conversions) || 0)
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
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie suas campanhas do Facebook Ads
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
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
              <button className="btn-primary flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Nova Campanha</span>
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <StatsCard
                  title="Contas Conectadas"
                  value={stats.totalAccounts}
                  icon={Users}
                  iconColor="text-blue-600"
                  change={stats.totalAccounts > 0 ? `+${stats.totalAccounts} nova(s)` : undefined}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <StatsCard
                  title="Contas Ativas"
                  value={stats.activeAccounts}
                  icon={TrendingUp}
                  iconColor="text-green-600"
                  change={stats.activeAccounts > 0 ? `${stats.activeAccounts} ativa(s)` : undefined}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <StatsCard
                  title="Campanhas"
                  value={stats.totalCampaigns}
                  icon={BarChart3}
                  iconColor="text-purple-600"
                  change={stats.totalCampaigns > 0 ? `${stats.totalCampaigns} ativa(s)` : undefined}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <StatsCard
                  title="Clones Realizados"
                  value={stats.totalClones}
                  icon={Copy}
                  iconColor="text-orange-600"
                  change={stats.totalClones > 0 ? `${stats.totalClones} este mês` : undefined}
                />
              </motion.div>
            </div>

            {/* Performance Metrics */}
            {insights.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Métricas de Performance
                  </h2>
                  <span className="text-sm text-gray-500">
                    Período: {datePreset === 'last_7d' ? 'Últimos 7 dias' : 
                              datePreset === 'last_30d' ? 'Últimos 30 dias' :
                              datePreset === 'today' ? 'Hoje' : datePreset}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">CPM</span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        R$ {derivedMetrics.cpm?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">CPC</span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        R$ {derivedMetrics.cpc?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">CTR</span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {derivedMetrics.ctr?.toFixed(2) || '0.00'}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Connected Accounts */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Contas Conectadas
                </h2>
                <button className="btn-secondary text-sm">
                  Ver Todas
                </button>
              </div>

              {accounts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {accounts.slice(0, 6).map((account, index) => (
                    <motion.div
                      key={account.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <AccountCard account={account} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Nenhuma conta conectada
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Conecte suas contas do Facebook para começar a clonar campanhas.
                  </p>
                  <button className="btn-primary">
                    Conectar Primeira Conta
                  </button>
                </motion.div>
              )}
            </div>

            {/* Recent Activity */}
            {accounts.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Atividade Recente
                </h2>
                <div className="card p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                          <Copy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Sistema pronto para clonagem
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Conecte suas contas para começar
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Agora
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  )
} 