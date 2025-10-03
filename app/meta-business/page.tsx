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
  Megaphone
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
  
  // Estados para lazy loading
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['accounts', 'campaigns']))
  const [loadingStates, setLoadingStates] = useState({
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

  // Função para buscar dados de contas
  const fetchAccounts = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, accounts: true }))
      const activeAccounts = facebookAccounts.filter(a => a.status === 'active')
      
      if (activeAccounts.length === 0) {
        toast.error('Nenhuma conta ativa encontrada')
        return
      }

      const allAccounts: MetaAccount[] = []

      for (const account of activeAccounts) {
        try {
          const accountsResponse = await fetch(`/api/meta-business/accounts?accountId=${account.id}&datePreset=${datePreset}${customRange ? `&since=${customRange.since}&until=${customRange.until}` : ''}`, {
            credentials: 'include'
          })
          
          if (accountsResponse.ok) {
            const accountsData = await accountsResponse.json()
            allAccounts.push(...accountsData.accounts || [])
          }
        } catch (error) {
          console.error(`Error fetching accounts for account ${account.id}:`, error)
        }
      }

      setAccounts(allAccounts)
      setLoadedTabs(prev => new Set(Array.from(prev).concat(['accounts'])))
      
      // Calcular estatísticas após carregar contas
      calculateStats(allAccounts, campaigns, adSets, ads)
      
    } catch (error) {
      console.error('Error fetching accounts:', error)
      toast.error('Erro ao carregar contas')
    } finally {
      setLoadingStates(prev => ({ ...prev, accounts: false }))
    }
  }, [facebookAccounts, datePreset, customRange, campaigns, adSets, ads])

  // Função para buscar dados de campanhas
  const fetchCampaigns = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, campaigns: true }))
      const activeAccounts = facebookAccounts.filter(a => a.status === 'active')
      
      if (activeAccounts.length === 0) {
        toast.error('Nenhuma conta ativa encontrada')
        return
      }

      const allCampaigns: MetaCampaign[] = []

      for (const account of activeAccounts) {
        try {
          const campaignsResponse = await fetch(`/api/meta-business/campaigns?accountId=${account.id}&datePreset=${datePreset}${customRange ? `&since=${customRange.since}&until=${customRange.until}` : ''}`, {
            credentials: 'include'
          })
          
          if (campaignsResponse.ok) {
            const campaignsData = await campaignsResponse.json()
            allCampaigns.push(...campaignsData.campaigns || [])
          }
        } catch (error) {
          console.error(`Error fetching campaigns for account ${account.id}:`, error)
        }
      }

      setCampaigns(allCampaigns)
      setLoadedTabs(prev => new Set(Array.from(prev).concat(['campaigns'])))
      
      // Calcular estatísticas após carregar campanhas
      calculateStats(accounts, allCampaigns, adSets, ads)
      
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast.error('Erro ao carregar campanhas')
    } finally {
      setLoadingStates(prev => ({ ...prev, campaigns: false }))
    }
  }, [facebookAccounts, datePreset, customRange, accounts, adSets, ads])

  // Função para buscar dados de ad sets
  const fetchAdSets = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, adsets: true }))
      const activeAccounts = facebookAccounts.filter(a => a.status === 'active')
      
      if (activeAccounts.length === 0) {
        toast.error('Nenhuma conta ativa encontrada')
        return
      }

      const allAdSets: MetaAdSet[] = []

      for (const account of activeAccounts) {
        try {
          const adSetsResponse = await fetch(`/api/meta-business/adsets?accountId=${account.id}&datePreset=${datePreset}${customRange ? `&since=${customRange.since}&until=${customRange.until}` : ''}`, {
            credentials: 'include'
          })
          
          if (adSetsResponse.ok) {
            const adSetsData = await adSetsResponse.json()
            allAdSets.push(...adSetsData.adSets || [])
          }
        } catch (error) {
          console.error(`Error fetching ad sets for account ${account.id}:`, error)
        }
      }

      setAdSets(allAdSets)
      setLoadedTabs(prev => new Set(Array.from(prev).concat(['adsets'])))
      
    } catch (error) {
      console.error('Error fetching ad sets:', error)
      toast.error('Erro ao carregar conjuntos')
    } finally {
      setLoadingStates(prev => ({ ...prev, adsets: false }))
    }
  }, [facebookAccounts, datePreset, customRange])

  // Função para buscar dados de ads
  const fetchAds = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, ads: true }))
      const activeAccounts = facebookAccounts.filter(a => a.status === 'active')
      
      if (activeAccounts.length === 0) {
        toast.error('Nenhuma conta ativa encontrada')
        return
      }

      const allAds: MetaAd[] = []

      for (const account of activeAccounts) {
        try {
          const adsResponse = await fetch(`/api/meta-business/ads?accountId=${account.id}&datePreset=${datePreset}${customRange ? `&since=${customRange.since}&until=${customRange.until}` : ''}`, {
            credentials: 'include'
          })
          
          if (adsResponse.ok) {
            const adsData = await adsResponse.json()
            allAds.push(...adsData.ads || [])
          }
        } catch (error) {
          console.error(`Error fetching ads for account ${account.id}:`, error)
        }
      }

      setAds(allAds)
      setLoadedTabs(prev => new Set(Array.from(prev).concat(['ads'])))
      
    } catch (error) {
      console.error('Error fetching ads:', error)
      toast.error('Erro ao carregar anúncios')
    } finally {
      setLoadingStates(prev => ({ ...prev, ads: false }))
    }
  }, [facebookAccounts, datePreset, customRange])

  // Função principal para carregar dados iniciais (contas e campanhas)
  const fetchInitialData = useCallback(async () => {
    try {
      setIsRefreshing(true)
      
      // Carregar contas e campanhas em paralelo (mas sequencialmente por conta)
      await Promise.all([
        fetchAccounts(),
        fetchCampaigns()
      ])
      
    } catch (error) {
      console.error('Error fetching initial data:', error)
      toast.error('Erro ao carregar dados iniciais')
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchAccounts, fetchCampaigns])

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

  // Função para lidar com mudança de abas com lazy loading
  const handleTabChange = useCallback(async (tabId: string) => {
    setActiveTab(tabId as any)
    
    // Se a aba ainda não foi carregada, carregar os dados
    if (!loadedTabs.has(tabId)) {
      switch(tabId) {
        case 'adsets':
          await fetchAdSets()
          break
        case 'ads':
          await fetchAds()
          break
        // 'accounts' e 'campaigns' já são carregados inicialmente
      }
    }
  }, [loadedTabs, fetchAdSets, fetchAds])

  // Ref para evitar dependências desnecessárias
  const fetchInitialDataRef = useRef(fetchInitialData)
  fetchInitialDataRef.current = fetchInitialData

  // Debounce da função fetchInitialData para evitar múltiplos refreshs
  const debouncedFetchInitialData = useDebounce('meta-business-fetch', fetchInitialData, 3000)

  useEffect(() => {
    if (facebookAccounts.length > 0) {
      // Usar ref para evitar dependência circular
      fetchInitialDataRef.current()
    }
  }, [facebookAccounts, datePreset, customRange])

  const handleRefresh = useDebounce('meta-business-refresh', async () => {
    await refreshAccounts()
    // Recarregar todas as abas que já foram carregadas
    const promises = []
    if (loadedTabs.has('accounts')) promises.push(fetchAccounts())
    if (loadedTabs.has('campaigns')) promises.push(fetchCampaigns())
    if (loadedTabs.has('adsets')) promises.push(fetchAdSets())
    if (loadedTabs.has('ads')) promises.push(fetchAds())
    
    await Promise.all(promises)
    toast.success('Dados atualizados!')
  }, 2000)

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset)
    if (preset !== 'custom') {
      setCustomRange(undefined)
    }
  }

  const handleCustomRangeChange = (range: DateRange) => {
    setCustomRange(range)
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
        // Recarregar apenas a aba específica
        if (type === 'campaigns') await fetchCampaigns()
        else if (type === 'adsets') await fetchAdSets()
        else if (type === 'ads') await fetchAds()
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
        // Recarregar apenas a aba específica
        if (type === 'campaigns') await fetchCampaigns()
        else if (type === 'adsets') await fetchAdSets()
        else if (type === 'ads') await fetchAds()
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

      // Recarregar dados em background para sincronizar com o servidor
      setTimeout(() => {
        if (type === 'campaigns') fetchCampaigns()
        else if (type === 'adsets') fetchAdSets()
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
                onClick={handleRefresh}
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

            {/* Abas */}
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
                    const isLoaded = loadedTabs.has(tab.id)
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        disabled={isLoading}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                          {isLoading ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>...</span>
                            </>
                          ) : isLoaded ? (
                            <span>{tab.count}</span>
                          ) : (
                            <span>0</span>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'accounts' && (
                  loadingStates.accounts ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Carregando contas...</p>
                      </div>
                    </div>
                  ) : (
                    <AccountsTable
                      accounts={accounts}
                      metrics={metrics}
                      showMetrics={true}
                    />
                  )
                )}
                
                {activeTab === 'campaigns' && (
                  loadingStates.campaigns ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Carregando campanhas...</p>
                      </div>
                    </div>
                  ) : (
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
                  )
                )}
                
                {activeTab === 'adsets' && (
                  loadingStates.adsets ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Carregando conjuntos...</p>
                      </div>
                    </div>
                  ) : (
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
                  )
                )}
                
                {activeTab === 'ads' && (
                  loadingStates.ads ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Carregando anúncios...</p>
                      </div>
                    </div>
                  ) : (
                    <AdsTable
                      ads={filteredAds}
                      selectedAds={selectedAds}
                      onSelectionChange={setSelectedAds}
                      onStatusToggle={handleToggleStatus}
                      onBulkStatusUpdate={handleBulkStatusUpdate}
                      metrics={metrics}
                      showMetrics={true}
                    />
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
