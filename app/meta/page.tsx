'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, DollarSign, MousePointer, Target, TrendingUp, BarChart3, RefreshCw, Settings, Repeat, Percent, Link, Heart, FolderOpen, Grid, FileText, Play, Pause, Edit3 } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import StatsCard from '@/components/dashboard/StatsCard'
import ColumnConfigModal from '@/components/dashboard/ColumnConfigModal'
import DateSelector, { DateRange } from '@/components/dashboard/DateSelector'
import MainMetricsSelector from '@/components/dashboard/MainMetricsSelector'
import MainMetricsOrderSelector from '@/components/dashboard/MainMetricsOrderSelector'
import { MetricConfig } from '@/components/dashboard/MetricsSelector'
import { FacebookAccount } from '@/lib/types'
import { ColumnConfig, DEFAULT_COLUMNS, getVisibleColumns, formatColumnValue } from '@/lib/column-config'
import toast from 'react-hot-toast'

type TabType = 'campaigns' | 'adsets' | 'ads'

export default function MetaBusinessPage() {
  const [accounts, setAccounts] = useState<FacebookAccount[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [adsets, setAdsets] = useState<any[]>([])
  const [ads, setAds] = useState<any[]>([])
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [datePreset, setDatePreset] = useState<string>('today')
  const [customRange, setCustomRange] = useState<DateRange | undefined>()
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<TabType>('campaigns')
  
  // Configuração das métricas principais
  const [mainMetrics, setMainMetrics] = useState<MetricConfig[]>([
    {
      id: 'impressions',
      label: 'Impressões',
      description: 'Número de vezes que seus anúncios foram exibidos',
      icon: Eye,
      iconColor: 'text-blue-600',
      type: 'number',
      visible: true,
      order: 1
    },
    {
      id: 'clicks',
      label: 'Cliques',
      description: 'Número de cliques em seus anúncios',
      icon: MousePointer,
      iconColor: 'text-green-600',
      type: 'number',
      visible: true,
      order: 2
    },
    {
      id: 'spend',
      label: 'Gasto',
      description: 'Valor total gasto em anúncios',
      icon: DollarSign,
      iconColor: 'text-red-600',
      type: 'currency',
      visible: true,
      order: 3
    },
    {
      id: 'reach',
      label: 'Alcance',
      description: 'Número de pessoas únicas que viram seus anúncios',
      icon: Target,
      iconColor: 'text-purple-600',
      type: 'number',
      visible: true,
      order: 4
    }
  ])

  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (accounts.length > 0) {
      fetchInsights()
      fetchCampaigns()
      fetchAdsets()
      fetchAds()
    }
  }, [accounts, datePreset, customRange, activeTab])

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
          
          let url = `/api/insights?accountId=${account.id}`
          if (customRange) {
            url += `&since=${customRange.since}&until=${customRange.until}`
          } else {
            url += `&datePreset=${datePreset}`
          }
          
          const response = await fetch(url, {
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

  const fetchCampaigns = async () => {
    try {
      const activeAccounts = accounts.filter(a => a.status === 'active')
      const allCampaigns = []
      
      for (const account of activeAccounts) {
        try {
          const response = await fetch(`/api/facebook/campaigns?accountId=${account.id}`, {
            credentials: 'include'
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.campaigns && data.campaigns.length > 0) {
              allCampaigns.push(...data.campaigns.map((campaign: any) => ({
                ...campaign,
                account_id: account.id,
                account_name: account.name
              })))
            }
          }
        } catch (error) {
          console.error(`Error fetching campaigns for account ${account.id}:`, error)
        }
      }
      
      setCampaigns(allCampaigns)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }

  const fetchAdsets = async () => {
    try {
      const activeAccounts = accounts.filter(a => a.status === 'active')
      const allAdsets = []
      
      for (const account of activeAccounts) {
        try {
          const response = await fetch(`/api/facebook/adsets?accountId=${account.id}`, {
            credentials: 'include'
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.adsets && data.adsets.length > 0) {
              allAdsets.push(...data.adsets.map((adset: any) => ({
                ...adset,
                account_id: account.id,
                account_name: account.name
              })))
            }
          }
        } catch (error) {
          console.error(`Error fetching adsets for account ${account.id}:`, error)
        }
      }
      
      setAdsets(allAdsets)
    } catch (error) {
      console.error('Error fetching adsets:', error)
    }
  }

  const fetchAds = async () => {
    try {
      const activeAccounts = accounts.filter(a => a.status === 'active')
      const allAds = []
      
      for (const account of activeAccounts) {
        try {
          const response = await fetch(`/api/facebook/ads?accountId=${account.id}`, {
            credentials: 'include'
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.ads && data.ads.length > 0) {
              allAds.push(...data.ads.map((ad: any) => ({
                ...ad,
                account_id: account.id,
                account_name: account.name
              })))
            }
          }
        } catch (error) {
          console.error(`Error fetching ads for account ${account.id}:`, error)
        }
      }
      
      setAds(allAds)
    } catch (error) {
      console.error('Error fetching ads:', error)
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

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset)
    if (preset !== 'custom') {
      setCustomRange(undefined)
    }
  }

  const handleCustomRangeChange = (range: DateRange) => {
    setCustomRange(range)
  }

  const handleMainMetricsChange = (newMetrics: MetricConfig[]) => {
    setMainMetrics(newMetrics)
    toast.success('Configuração de métricas salva!')
  }

  const handleToggleStatus = async (type: 'campaign' | 'adset' | 'ad', id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
      
      const response = await fetch(`/api/facebook/${type}s/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id,
          status: newStatus
        })
      })

      if (response.ok) {
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} ${newStatus === 'ACTIVE' ? 'ativado' : 'desativado'} com sucesso!`)
        
        // Atualizar o estado local
        if (type === 'campaign') {
          setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
        } else if (type === 'adset') {
          setAdsets(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
        } else {
          setAds(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
        }
      } else {
        toast.error('Erro ao alterar status')
      }
    } catch (error) {
      console.error('Error toggling status:', error)
      toast.error('Erro ao alterar status')
    }
  }

  const handleEditBudget = async (type: 'campaign' | 'adset', id: string, newBudget: number) => {
    try {
      const response = await fetch(`/api/facebook/${type}s/budget`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id,
          budget: newBudget
        })
      })

      if (response.ok) {
        toast.success('Orçamento atualizado com sucesso!')
        
        // Atualizar o estado local
        if (type === 'campaign') {
          setCampaigns(prev => prev.map(c => c.id === id ? { ...c, daily_budget: newBudget } : c))
        } else {
          setAdsets(prev => prev.map(a => a.id === id ? { ...a, daily_budget: newBudget } : a))
        }
      } else {
        toast.error('Erro ao atualizar orçamento')
      }
    } catch (error) {
      console.error('Error updating budget:', error)
      toast.error('Erro ao atualizar orçamento')
    }
  }

  const visibleColumns = getVisibleColumns(columns)

  // Calcular métricas agregadas dos insights
  const aggregatedMetrics = insights.reduce((acc, insight) => {
    return {
      impressions: (acc.impressions || 0) + (parseInt(insight.impressions || '0') || 0),
      clicks: (acc.clicks || 0) + (parseInt(insight.clicks || '0') || 0),
      spend: (acc.spend || 0) + (parseFloat(insight.spend || '0') || 0),
      reach: (acc.reach || 0) + (parseInt(insight.reach || '0') || 0),
      frequency: (acc.frequency || 0) + (parseFloat(insight.frequency || '0') || 0),
      cpm: (acc.cpm || 0) + (parseFloat(insight.cpm || '0') || 0),
      cpc: (acc.cpc || 0) + (parseFloat(insight.cpc || '0') || 0),
      ctr: (acc.ctr || 0) + (parseFloat(insight.ctr || '0') || 0),
      conversions: (acc.conversions || 0) + (parseInt(insight.conversions || '0') || 0),
      cost_per_conversion: (acc.cost_per_conversion || 0) + (parseFloat(insight.cost_per_conversion || '0') || 0),
      inline_link_clicks: (acc.inline_link_clicks || 0) + (parseInt(insight.inline_link_clicks || '0') || 0),
      inline_post_engagement: (acc.inline_post_engagement || 0) + (parseInt(insight.inline_post_engagement || '0') || 0)
    }
  }, {})

  // Calcular métricas derivadas
  const derivedMetrics = {
    cpm: aggregatedMetrics.impressions > 0 ? (aggregatedMetrics.spend / aggregatedMetrics.impressions) * 1000 : 0,
    cpc: aggregatedMetrics.clicks > 0 ? aggregatedMetrics.spend / aggregatedMetrics.clicks : 0,
    ctr: aggregatedMetrics.impressions > 0 ? (aggregatedMetrics.clicks / aggregatedMetrics.impressions) * 100 : 0
  }

  const getCurrentData = () => {
    switch (activeTab) {
      case 'campaigns':
        return campaigns
      case 'adsets':
        return adsets
      case 'ads':
        return ads
      default:
        return []
    }
  }

  const getTabLabel = () => {
    switch (activeTab) {
      case 'campaigns':
        return 'Campanhas'
      case 'adsets':
        return 'Conjuntos de Anúncios'
      case 'ads':
        return 'Anúncios'
      default:
        return ''
    }
  }

  const tabs = [
    { id: 'campaigns' as TabType, label: 'Campanhas', icon: FolderOpen },
    { id: 'adsets' as TabType, label: 'Conjuntos', icon: Grid },
    { id: 'ads' as TabType, label: 'Anúncios', icon: FileText }
  ]

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Carregando Meta Business...</p>
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
                Meta Business Manager
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerenciamento avançado de campanhas, conjuntos e anúncios
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <DateSelector
                datePreset={datePreset}
                customRange={customRange}
                onDatePresetChange={handleDatePresetChange}
                onCustomRangeChange={handleCustomRangeChange}
              />
              <MainMetricsSelector
                metrics={mainMetrics}
                onMetricsChange={handleMainMetricsChange}
              />
              <MainMetricsOrderSelector
                metrics={mainMetrics}
                onMetricsChange={handleMainMetricsChange}
              />
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
                <div className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Métricas Principais */}
            {insights.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {mainMetrics
                    .filter(metric => metric.visible)
                    .sort((a, b) => a.order - b.order)
                    .map((metric, index) => {
                      const value = aggregatedMetrics[metric.id as keyof typeof aggregatedMetrics]
                      let displayValue = '0'
                      
                      if (value !== undefined) {
                        switch (metric.type) {
                          case 'currency':
                            displayValue = `R$ ${parseFloat(value.toString() || '0').toFixed(2)}`
                            break
                          case 'percentage':
                            displayValue = `${parseFloat(value.toString() || '0').toFixed(2)}%`
                            break
                          case 'number':
                          default:
                            displayValue = parseInt(value.toString() || '0').toLocaleString()
                            break
                        }
                      }
                      
                      return (
                        <motion.div
                          key={metric.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
                        >
                          <StatsCard
                            title={metric.label}
                            value={displayValue}
                            icon={metric.icon}
                            iconColor={metric.iconColor}
                          />
                        </motion.div>
                      )
                    })}
                </div>

                {/* Abas de Navegação */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex space-x-8 px-6">
                      {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                              activeTab === tab.id
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                          </button>
                        )
                      })}
                    </nav>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {getTabLabel()}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getCurrentData().length} {getTabLabel().toLowerCase()} encontrado(s)
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="btn-primary flex items-center space-x-2">
                          <span>+</span>
                          <span>Criar</span>
                        </button>
                        <button className="btn-secondary">Duplicar</button>
                        <button className="btn-secondary">Editar</button>
                        <button className="btn-secondary">Teste A/B</button>
                        <button className="btn-secondary">
                          Mais
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Tabela de Dados */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              <input type="checkbox" className="rounded border-gray-300" />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              {getTabLabel()} ↑↓
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Veiculação ↑
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Ações
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Orçamento ↑↓
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Valor usado ↑↓
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Resultados ↑↓
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Custo por resultado ↑↓
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {getCurrentData().slice(0, 10).map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input type="checkbox" className="rounded border-gray-300" />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => handleToggleStatus(
                                    activeTab === 'campaigns' ? 'campaign' : 
                                    activeTab === 'adsets' ? 'adset' : 'ad',
                                    item.id,
                                    item.status
                                  )}
                                  className={`flex items-center space-x-2 ${
                                    item.status === 'ACTIVE' 
                                      ? 'text-green-600 hover:text-green-800' 
                                      : 'text-gray-400 hover:text-gray-600'
                                  }`}
                                >
                                  {item.status === 'ACTIVE' ? (
                                    <Play className="w-4 h-4" />
                                  ) : (
                                    <Pause className="w-4 h-4" />
                                  )}
                                  <span className="text-sm">
                                    {item.status === 'ACTIVE' ? 'Ativo' : 'Pausado'}
                                  </span>
                                </button>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {item.name || item.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {item.status === 'ACTIVE' ? 'Ativo' : 'Pausado'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <button className="text-blue-600 hover:text-blue-800">
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleToggleStatus(
                                      activeTab === 'campaigns' ? 'campaign' : 
                                      activeTab === 'adsets' ? 'adset' : 'ad',
                                      item.id,
                                      item.status
                                    )}
                                    className="text-gray-600 hover:text-gray-800"
                                  >
                                    {item.status === 'ACTIVE' ? (
                                      <Pause className="w-4 h-4" />
                                    ) : (
                                      <Play className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-900 dark:text-white">
                                    R$ {item.daily_budget || item.budget || '0,00'}
                                  </span>
                                  <button 
                                    onClick={() => {
                                      const newBudget = prompt('Novo orçamento:', item.daily_budget || item.budget || '0')
                                      if (newBudget && !isNaN(parseFloat(newBudget))) {
                                        handleEditBudget(
                                          activeTab === 'campaigns' ? 'campaign' : 'adset',
                                          item.id,
                                          parseFloat(newBudget)
                                        )
                                      }
                                    }}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                R$ {item.spend || '0,00'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {item.results || '0'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                R$ {item.cost_per_result || '0,00'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      Resultados de {getCurrentData().length} {getTabLabel().toLowerCase()} • Não inclui itens excluídos
                    </div>
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
