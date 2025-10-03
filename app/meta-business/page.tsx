'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Eye, 
  DollarSign, 
  MousePointer, 
  Target,
  TrendingUp, 
  RefreshCw, 
  Settings, 
  Play, 
  Pause, 
  Archive,
  Search,
  Filter,
  Calendar,
  Users,
  Layers,
  Megaphone,
  Loader2
} from 'lucide-react'
import { ALL_METRICS, MAIN_METRICS, MetricConfig } from '@/lib/metrics-config'
import AccountsIcon from '@/components/meta-business/icons/AccountsIcon'
import CampaignsIcon from '@/components/meta-business/icons/CampaignsIcon'
import AdSetsIcon from '@/components/meta-business/icons/AdSetsIcon'
import AdsIcon from '@/components/meta-business/icons/AdsIcon'
import Sidebar from '@/components/layout/Sidebar'
import StatsCard from '@/components/dashboard/StatsCard'
import DateSelector, { DateRange } from '@/components/dashboard/DateSelector'
import AccountsTable from '@/components/meta-business/AccountsTable'
import CampaignsTable from '@/components/meta-business/CampaignsTable'
import AdSetsTable from '@/components/meta-business/AdSetsTable'
import AdsTable from '@/components/meta-business/AdsTable'
import MetaBusinessMetricsSelector from '@/components/meta-business/MetricsSelector'
import { 
  MetaAccount,
  MetaCampaign, 
  MetaAdSet, 
  MetaAd, 
  MetaBusinessStats
} from '@/lib/types'
import { useApp } from '@/contexts/AppContext'
import { useDebounce } from '@/lib/debounce'
import toast from 'react-hot-toast'

export default function MetaBusinessPage() {
  const { accounts: facebookAccounts, isLoading: accountsLoading, refreshAccounts } = useApp()
  const [activeTab, setActiveTab] = useState<'accounts' | 'campaigns' | 'adsets' | 'ads'>('accounts')
  const [datePreset, setDatePreset] = useState('last_30d')
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined)
  const [accounts, setAccounts] = useState<MetaAccount[]>([])
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([])
  const [adSets, setAdSets] = useState<MetaAdSet[]>([])
  const [ads, setAds] = useState<MetaAd[]>([])
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  
  // 🚀 NOVO: Estados de carregamento lazy loading
  const [loadingStates, setLoadingStates] = useState({
    accounts: false,
    campaigns: false,
    adsets: false,
    ads: false
  })
  
  // 🚀 NOVO: Estados de dados carregados
  const [loadedStates, setLoadedStates] = useState({
    accounts: false,
    campaigns: false,
    adsets: false,
    ads: false
  })
  
  const [stats, setStats] = useState<MetaBusinessStats>({
    totalSpend: 0,
    totalImpressions: 0,
    totalClicks: 0,
    averageCpc: 0,
    averageCtr: 0,
    totalCampaigns: 0,
    totalAdSets: 0,
    totalAds: 0,
    activeCampaigns: 0,
    activeAdSets: 0,
    activeAds: 0
  })
  
  // Filtros globais (removido datePreset e customRange)
  const [filters, setFilters] = useState({
    status: [] as string[],
    search: '',
    accountIds: [] as string[]
  })

  // Estados de seleção em massa
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set())
  const [selectedAdSets, setSelectedAdSets] = useState<Set<string>>(new Set())
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set())

  // Estados para métricas avançadas
  const [metrics, setMetrics] = useState<MetricConfig[]>(() => {
    // Inicializar com métricas principais visíveis
    return ALL_METRICS.map(metric => ({
      ...metric,
      visible: MAIN_METRICS.some(m => m.id === metric.id)
    }))
  })
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // 🚀 NOVO: Função para carregar dados específicos por tipo
  const fetchDataByType = useCallback(async (type: 'accounts' | 'campaigns' | 'adsets' | 'ads') => {
    try {
      console.log(`🔄 Carregando dados de ${type}...`)
      setLoadingStates(prev => ({ ...prev, [type]: true }))
      
      const activeAccounts = facebookAccounts.filter(a => a.status === 'active')
      
      if (activeAccounts.length === 0) {
        toast.error('Nenhuma conta ativa encontrada')
        return
      }

      let allData: any[] = []
      const apiEndpoint = type === 'accounts' ? 'accounts' : 
                         type === 'campaigns' ? 'campaigns' :
                         type === 'adsets' ? 'adsets' : 'ads'

      for (const account of activeAccounts) {
        try {
          const response = await fetch(`/api/meta-business/${apiEndpoint}?accountId=${account.id}&datePreset=${datePreset}${customRange ? `&since=${customRange.since}&until=${customRange.until}` : ''}`, {
            credentials: 'include'
          })
          
          if (response.ok) {
            const data = await response.json()
            const key = type === 'accounts' ? 'accounts' : 
                       type === 'campaigns' ? 'campaigns' :
                       type === 'adsets' ? 'adSets' : 'ads'
            allData.push(...(data[key] || []))
          }
        } catch (error) {
          console.error(`Error fetching ${type} for account ${account.id}:`, error)
        }
      }

      // Atualizar estado específico
      if (type === 'accounts') {
        setAccounts(allData)
      } else if (type === 'campaigns') {
        setCampaigns(allData)
      } else if (type === 'adsets') {
        setAdSets(allData)
      } else if (type === 'ads') {
        setAds(allData)
      }

      // Marcar como carregado
      setLoadedStates(prev => ({ ...prev, [type]: true }))
      
      // Recalcular estatísticas se necessário
      if (type === 'accounts' || type === 'campaigns') {
        calculateStats(accounts, campaigns, adSets, ads)
      }
      
      console.log(`✅ Dados de ${type} carregados: ${allData.length} itens`)
      
    } catch (error) {
      console.error(`Error fetching ${type}:`, error)
      toast.error(`Erro ao carregar ${type}`)
    } finally {
      setLoadingStates(prev => ({ ...prev, [type]: false }))
    }
  }, [facebookAccounts, datePreset, customRange, accounts, campaigns, adSets, ads])

  // 🚀 NOVO: Função para carregar dados iniciais (apenas contas)
  const fetchInitialData = useCallback(async () => {
    try {
      setIsRefreshing(true)
      await fetchDataByType('accounts')
    } catch (error) {
      console.error('Error fetching initial data:', error)
      toast.error('Erro ao carregar dados iniciais')
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchDataByType])

  // 🚀 NOVO: Função para trocar de aba com lazy loading
  const handleTabChange = useCallback(async (tabName: 'accounts' | 'campaigns' | 'adsets' | 'ads') => {
    setActiveTab(tabName)
    
    // Se a aba não foi carregada ainda, carregar agora
    if (!loadedStates[tabName]) {
      await fetchDataByType(tabName)
    }
  }, [loadedStates, fetchDataByType])

  // 🚀 NOVO: Função para recarregar dados específicos
  const handleRefreshSpecific = useCallback(async (type: 'accounts' | 'campaigns' | 'adsets' | 'ads') => {
    setLoadedStates(prev => ({ ...prev, [type]: false }))
    await fetchDataByType(type)
    toast.success(`${type === 'accounts' ? 'Contas' : type === 'campaigns' ? 'Campanhas' : type === 'adsets' ? 'Conjuntos' : 'Anúncios'} atualizados!`)
  }, [fetchDataByType])

  // 🚀 NOVO: Função para recarregar tudo
  const handleRefreshAll = useDebounce('meta-business-refresh-all', async () => {
    await refreshAccounts()
    // Limpar todos os estados carregados
    setLoadedStates({
      accounts: false,
      campaigns: false,
      adsets: false,
      ads: false
    })
    // Recarregar dados iniciais
    await fetchInitialData()
    toast.success('Todos os dados atualizados!')
  }, 2000)

  const calculateStats = (accounts: MetaAccount[], campaigns: MetaCampaign[], adSets: MetaAdSet[], ads: MetaAd[]) => {
    // Usar dados das contas se disponíveis, senão usar campanhas
    const dataSource = accounts.length > 0 ? accounts : campaigns
    const totalSpend = dataSource.reduce((sum, c) => sum + c.spend, 0)
    const totalImpressions = dataSource.reduce((sum, c) => sum + c.impressions, 0)
    const totalClicks = dataSource.reduce((sum, c) => sum + c.clicks, 0)
    
    setStats({
      totalSpend,
      totalImpressions,
      totalClicks,
      averageCpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      averageCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      totalCampaigns: campaigns.length,
      totalAdSets: adSets.length,
      totalAds: ads.length,
      activeCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
      activeAdSets: adSets.filter(a => a.status === 'ACTIVE').length,
      activeAds: ads.filter(a => a.status === 'ACTIVE').length
    })
  }

  // 🚀 NOVO: Carregar dados iniciais apenas quando necessário
  useEffect(() => {
    if (facebookAccounts.length > 0 && !loadedStates.accounts) {
      fetchInitialData()
    }
  }, [facebookAccounts, loadedStates.accounts, fetchInitialData])

  // 🚀 NOVO: Atualizar filtros quando contas carregarem
  useEffect(() => {
    if (accounts.length > 0) {
      setFilters(prev => ({
        ...prev,
        accountIds: accounts.map(acc => acc.id)
      }))
    }
  }, [accounts])

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset)
    if (preset !== 'custom') {
      setCustomRange(undefined)
    }
    // 🚀 NOVO: Limpar dados carregados quando mudar período
    setLoadedStates({
      accounts: false,
      campaigns: false,
      adsets: false,
      ads: false
    })
  }

  const handleCustomRangeChange = (range: DateRange) => {
    setCustomRange(range)
    // 🚀 NOVO: Limpar dados carregados quando mudar período
    setLoadedStates({
      accounts: false,
      campaigns: false,
      adsets: false,
      ads: false
    })
  }

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({
      ...prev,
      search
    }))
  }

  const handleStatusFilter = (status: string[]) => {
    setFilters(prev => ({
      ...prev,
      status
    }))
  }

  const handleAccountFilter = (accountIds: string[]) => {
    setFilters(prev => ({
      ...prev,
      accountIds
    }))
  }

  // Funções para gerenciar métricas
  const handleMetricsChange = (metricIds: string[]) => {
    console.log('🔄 Atualizando métricas:', metricIds)
    
    // Manter a ordem das métricas selecionadas
    const newMetrics = metricIds.map(id => {
      const metric = ALL_METRICS.find(m => m.id === id)
      return metric ? { ...metric, visible: true } : null
    }).filter(Boolean) as MetricConfig[]
    
    // Adicionar métricas não selecionadas como invisíveis
    const hiddenMetrics = ALL_METRICS.filter(metric => 
      !metricIds.includes(metric.id)
    ).map(metric => ({ ...metric, visible: false }))
    
    const finalMetrics = [...newMetrics, ...hiddenMetrics]
    console.log('📊 Métricas finais:', finalMetrics.filter(m => m.visible).map(m => m.label))
    
    setMetrics(finalMetrics)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
  }

  // Funções de seleção em massa
  const handleSelectAll = (type: 'campaigns' | 'adsets' | 'ads') => {
    if (type === 'campaigns') {
      setSelectedCampaigns(new Set(campaigns.map(c => c.id)))
    } else if (type === 'adsets') {
      setSelectedAdSets(new Set(adSets.map(a => a.id)))
    } else if (type === 'ads') {
      setSelectedAds(new Set(ads.map(a => a.id)))
    }
  }

  const handleDeselectAll = (type: 'campaigns' | 'adsets' | 'ads') => {
    if (type === 'campaigns') {
      setSelectedCampaigns(new Set())
    } else if (type === 'adsets') {
      setSelectedAdSets(new Set())
    } else if (type === 'ads') {
      setSelectedAds(new Set())
    }
  }

  const handleToggleStatus = async (type: 'campaigns' | 'adsets' | 'ads', id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    
    try {
      const response = await fetch(`/api/meta-business/${type}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include'
      })

      if (response.ok) {
        toast.success(`${type === 'campaigns' ? 'Campanha' : type === 'adsets' ? 'Conjunto' : 'Anúncio'} ${newStatus === 'ACTIVE' ? 'ativado' : 'pausado'}!`)
        // 🚀 NOVO: Recarregar apenas o tipo específico
        await handleRefreshSpecific(type as any)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao alterar status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Erro ao alterar status')
    }
  }

  const handleBulkStatusUpdate = async (type: 'campaigns' | 'adsets' | 'ads', status: string) => {
    const selectedIds = type === 'campaigns' ? Array.from(selectedCampaigns) : 
                       type === 'adsets' ? Array.from(selectedAdSets) : 
                       Array.from(selectedAds)

    if (selectedIds.length === 0) {
      toast.error('Nenhum item selecionado')
      return
    }

    try {
      const response = await fetch(`/api/meta-business/${type}/bulk-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedIds, status }),
        credentials: 'include'
      })

      if (response.ok) {
        toast.success(`${selectedIds.length} ${type === 'campaigns' ? 'campanhas' : type === 'adsets' ? 'conjuntos' : 'anúncios'} ${status === 'ACTIVE' ? 'ativados' : 'pausados'}!`)
        // 🚀 NOVO: Recarregar apenas o tipo específico
        await handleRefreshSpecific(type as any)
        // Limpar seleção
        if (type === 'campaigns') setSelectedCampaigns(new Set())
        else if (type === 'adsets') setSelectedAdSets(new Set())
        else setSelectedAds(new Set())
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao alterar status em lote')
      }
    } catch (error) {
      console.error('Error bulk updating status:', error)
      toast.error('Erro ao alterar status em lote')
    }
  }

  const handleBudgetUpdate = async (type: 'campaigns' | 'adsets', id: string, budget: number, budgetType: 'daily' | 'lifetime') => {
    try {
      // Atualizar o estado local imediatamente para feedback visual
      if (type === 'campaigns') {
        setCampaigns(prev => prev.map(campaign => 
          campaign.id === id 
            ? { 
                ...campaign, 
                [budgetType === 'daily' ? 'daily_budget' : 'lifetime_budget']: budget,
                budget_type: budgetType
              }
            : campaign
        ))
      } else if (type === 'adsets') {
        setAdSets(prev => prev.map(adSet => 
          adSet.id === id 
            ? { 
                ...adSet, 
                [budgetType === 'daily' ? 'daily_budget' : 'lifetime_budget']: budget,
                budget_type: budgetType
              }
            : adSet
        ))
      }

      // 🚀 NOVO: Recarregar apenas o tipo específico em background
      setTimeout(() => {
        handleRefreshSpecific(type as any)
      }, 1000)
    } catch (error) {
      console.error('Error updating budget state:', error)
    }
  }

  // Filtrar dados baseado nos filtros
  const filteredCampaigns = campaigns.filter(campaign => {
    if (filters.search && !campaign.name.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.status.length > 0 && !filters.status.includes(campaign.status)) return false
    if (filters.accountIds.length > 0 && !filters.accountIds.includes(campaign.account_id)) return false
    return true
  })

  const filteredAdSets = adSets.filter(adSet => {
    if (filters.search && !adSet.name.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.status.length > 0 && !filters.status.includes(adSet.status)) return false
    if (filters.accountIds.length > 0 && !filters.accountIds.includes(adSet.account_id)) return false
    return true
  })

  const filteredAds = ads.filter(ad => {
    if (filters.search && !ad.name.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.status.length > 0 && !filters.status.includes(ad.status)) return false
    if (filters.accountIds.length > 0 && !filters.accountIds.includes(ad.account_id)) return false
    return true
  })

  // 🚀 NOVO: Componente de loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      ))}
    </div>
  )

  if (accountsLoading) {
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
                Meta Business
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie campanhas, conjuntos e anúncios do Facebook/Instagram
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                <MetaBusinessMetricsSelector
                  onMetricsChange={handleMetricsChange}
                />
                <DateSelector
                  datePreset={datePreset}
                  customRange={customRange}
                  onDatePresetChange={handleDatePresetChange}
                  onCustomRangeChange={handleCustomRangeChange}
                />
              </div>
              <button
                onClick={handleRefreshAll}
                disabled={isRefreshing}
                className="btn-secondary flex items-center justify-center space-x-2 px-4 py-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar</span>
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
            {/* Cards de Estatísticas Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Gasto Total"
                value={`R$ ${stats.totalSpend.toFixed(2)}`}
                icon={DollarSign}
                iconColor="text-red-600"
              />
              <StatsCard
                title="Impressões"
                value={stats.totalImpressions.toLocaleString()}
                icon={Eye}
                iconColor="text-blue-600"
              />
              <StatsCard
                title="Cliques"
                value={stats.totalClicks.toLocaleString()}
                icon={MousePointer}
                iconColor="text-green-600"
              />
              <StatsCard
                title="CPC Médio"
                value={`R$ ${stats.averageCpc.toFixed(2)}`}
                icon={Target}
                iconColor="text-purple-600"
              />
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center space-x-2 w-full sm:w-auto sm:min-w-0">
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={filters.search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white w-full sm:w-64 min-w-0"
                  />
                </div>
                
                <div className="flex items-center space-x-2 w-full sm:w-auto sm:min-w-0">
                  <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <select
                    value={filters.status.join(',')}
                    onChange={(e) => handleStatusFilter(e.target.value ? e.target.value.split(',') : [])}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white w-full sm:w-auto min-w-0"
                  >
                    <option value="">Todos os Status</option>
                    <option value="ACTIVE">Ativo</option>
                    <option value="PAUSED">Pausado</option>
                    <option value="ARCHIVED">Arquivado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 🚀 NOVO: Abas com Lazy Loading */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'accounts', label: 'Contas', icon: AccountsIcon, count: accounts.length },
                    { id: 'campaigns', label: 'Campanhas', icon: CampaignsIcon, count: filteredCampaigns.length },
                    { id: 'adsets', label: 'Conjuntos', icon: AdSetsIcon, count: filteredAdSets.length },
                    { id: 'ads', label: 'Anúncios', icon: AdsIcon, count: filteredAds.length }
                  ].map((tab) => {
                    const Icon = tab.icon
                    const isLoading = loadingStates[tab.id as keyof typeof loadingStates]
                    const isLoaded = loadedStates[tab.id as keyof typeof loadedStates]
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id as any)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                          {tab.count}
                        </span>
                        {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                        {!isLoaded && !isLoading && tab.id !== 'accounts' && (
                          <span className="w-2 h-2 bg-orange-400 rounded-full" title="Clique para carregar" />
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'accounts' && (
                  loadedStates.accounts ? (
                    <AccountsTable
                      accounts={accounts}
                      metrics={metrics}
                      showMetrics={true}
                    />
                  ) : (
                    <LoadingSkeleton />
                  )
                )}
                
                {activeTab === 'campaigns' && (
                  loadedStates.campaigns ? (
                    <CampaignsTable
                      campaigns={filteredCampaigns}
                      selectedCampaigns={selectedCampaigns}
                      onSelectionChange={setSelectedCampaigns}
                      onStatusToggle={handleToggleStatus}
                      onBudgetUpdate={handleBudgetUpdate}
                      onBulkStatusUpdate={handleBulkStatusUpdate}
                      metrics={metrics}
                      showMetrics={true}
                    />
                  ) : (
                    <LoadingSkeleton />
                  )
                )}
                
                {activeTab === 'adsets' && (
                  loadedStates.adsets ? (
                    <AdSetsTable
                      adSets={filteredAdSets}
                      selectedAdSets={selectedAdSets}
                      onSelectionChange={setSelectedAdSets}
                      onStatusToggle={handleToggleStatus}
                      onBudgetUpdate={handleBudgetUpdate}
                      onBulkStatusUpdate={handleBulkStatusUpdate}
                      metrics={metrics}
                      showMetrics={true}
                    />
                  ) : (
                    <LoadingSkeleton />
                  )
                )}
                
                {activeTab === 'ads' && (
                  loadedStates.ads ? (
                    <AdsTable
                      ads={filteredAds}
                      selectedAds={selectedAds}
                      onSelectionChange={setSelectedAds}
                      onStatusToggle={handleToggleStatus}
                      onBulkStatusUpdate={handleBulkStatusUpdate}
                      metrics={metrics}
                      showMetrics={true}
                    />
                  ) : (
                    <LoadingSkeleton />
                  )
                )}
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}