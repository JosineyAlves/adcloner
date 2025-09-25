'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, DollarSign, MousePointer, Target, TrendingUp, BarChart3, RefreshCw, Settings, Repeat, Percent, Link, Heart } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import DashboardTabs, { TabType } from '@/components/dashboard/DashboardTabs'
import AccountsTab from '@/components/dashboard/tabs/AccountsTab'
import CampaignsTab from '@/components/dashboard/tabs/CampaignsTab'
import AdSetsTab from '@/components/dashboard/tabs/AdSetsTab'
import AdsTab from '@/components/dashboard/tabs/AdsTab'
import StatsCard from '@/components/dashboard/StatsCard'
import ColumnConfigModal from '@/components/dashboard/ColumnConfigModal'
import DateSelector, { DateRange } from '@/components/dashboard/DateSelector'
import MainMetricsSelector from '@/components/dashboard/MainMetricsSelector'
import MainMetricsOrderSelector from '@/components/dashboard/MainMetricsOrderSelector'
import { MetricConfig } from '@/components/dashboard/MetricsSelector'
import { FacebookAccount } from '@/lib/types'
import { ColumnConfig, DEFAULT_COLUMNS, getVisibleColumns, formatColumnValue } from '@/lib/column-config'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<FacebookAccount[]>([])
  const [insights, setInsights] = useState<any[]>([])
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
    },
    {
      id: 'frequency',
      label: 'Frequência',
      description: 'Média de vezes que cada pessoa viu seu anúncio',
      icon: Repeat,
      iconColor: 'text-orange-600',
      type: 'number',
      visible: false,
      order: 5
    },
    {
      id: 'cpm',
      label: 'CPM',
      description: 'Custo por mil impressões',
      icon: TrendingUp,
      iconColor: 'text-indigo-600',
      type: 'currency',
      visible: false,
      order: 6
    },
    {
      id: 'cpc',
      label: 'CPC',
      description: 'Custo por clique',
      icon: MousePointer,
      iconColor: 'text-teal-600',
      type: 'currency',
      visible: false,
      order: 7
    },
    {
      id: 'ctr',
      label: 'CTR',
      description: 'Taxa de clique (cliques / impressões)',
      icon: Percent,
      iconColor: 'text-pink-600',
      type: 'percentage',
      visible: false,
      order: 8
    },
    {
      id: 'conversions',
      label: 'Conversões',
      description: 'Número de conversões realizadas',
      icon: Target,
      iconColor: 'text-emerald-600',
      type: 'number',
      visible: false,
      order: 9
    },
    {
      id: 'cost_per_conversion',
      label: 'Custo por Conversão',
      description: 'Custo médio por conversão',
      icon: DollarSign,
      iconColor: 'text-amber-600',
      type: 'currency',
      visible: false,
      order: 10
    },
    {
      id: 'inline_link_clicks',
      label: 'Cliques em Links',
      description: 'Número de cliques em links específicos',
      icon: Link,
      iconColor: 'text-cyan-600',
      type: 'number',
      visible: false,
      order: 11
    },
    {
      id: 'inline_post_engagement',
      label: 'Engajamento',
      description: 'Interações com o post (likes, comentários, shares)',
      icon: Heart,
      iconColor: 'text-rose-600',
      type: 'number',
      visible: false,
      order: 12
    }
  ])

  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (accounts.length > 0) {
      fetchInsights()
    }
  }, [accounts, datePreset, customRange])

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

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Sistema de Abas */}
          <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
          
          {/* Conteúdo das Abas */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'accounts' && (
              <AccountsTab 
                accounts={accounts}
                onRefresh={fetchAccounts}
                isLoading={isLoading}
              />
            )}
            
            {activeTab === 'campaigns' && (
              <CampaignsTab 
                campaigns={insights.map(insight => ({
                  id: insight.campaign_id || insight.id,
                  name: insight.campaign_name || insight.name || 'Campanha sem nome',
                  status: insight.status || 'PAUSED',
                  objective: insight.objective || 'N/A',
                  budget: parseFloat(insight.budget || '0'),
                  spend: parseFloat(insight.spend || '0'),
                  impressions: parseInt(insight.impressions || '0'),
                  clicks: parseInt(insight.clicks || '0'),
                  reach: parseInt(insight.reach || '0'),
                  frequency: parseFloat(insight.frequency || '0'),
                  ctr: parseFloat(insight.ctr || '0'),
                  cpm: parseFloat(insight.cpm || '0'),
                  cpc: parseFloat(insight.cpc || '0'),
                  conversions: parseInt(insight.conversions || '0'),
                  cost_per_conversion: parseFloat(insight.cost_per_conversion || '0'),
                  account_name: insight.account_name || 'Conta sem nome',
                  created_time: insight.created_time || '',
                  updated_time: insight.updated_time || ''
                }))}
                onRefresh={fetchInsights}
                isLoading={isLoading}
              />
            )}
            
            {activeTab === 'adsets' && (
              <AdSetsTab 
                adSets={[]} // Mock data - será implementado posteriormente
                onRefresh={fetchInsights}
                isLoading={isLoading}
              />
            )}
            
            {activeTab === 'ads' && (
              <AdsTab 
                ads={[]} // Mock data - será implementado posteriormente
                onRefresh={fetchInsights}
                isLoading={isLoading}
              />
            )}
          </div>
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