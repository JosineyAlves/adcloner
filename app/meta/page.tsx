git add .'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, DollarSign, MousePointer, Target, TrendingUp, BarChart3, RefreshCw, Settings, Repeat, Percent, Link, Heart, Pause, Play, DollarSign as DollarIcon } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import StatsCard from '@/components/dashboard/StatsCard'
import DateSelector, { DateRange } from '@/components/dashboard/DateSelector'
import UnifiedMetricsModal, { MetricOption } from '@/components/meta/UnifiedMetricsModal'
import InlineBudgetEditor from '@/components/meta/InlineBudgetEditor'
import StatusToggle from '@/components/meta/StatusToggle'
import TableCheckbox from '@/components/meta/TableCheckbox'
import { FacebookAccount } from '@/lib/types'
import toast from 'react-hot-toast'

type TabType = 'contas' | 'campanhas' | 'conjuntos' | 'anuncios'

interface Campaign {
  id: string
  name: string
  status: string
  objective: string
  daily_budget?: number
  lifetime_budget?: number
  created_time: string
  updated_time: string
}

interface AdSet {
  id: string
  name: string
  status: string
  campaign_id: string
  daily_budget?: number
  lifetime_budget?: number
  optimization_goal: string
  created_time: string
  updated_time: string
}

interface Ad {
  id: string
  name: string
  status: string
  adset_id: string
  campaign_id: string
  created_time: string
  updated_time: string
}

export default function MetaPage() {
  const [accounts, setAccounts] = useState<FacebookAccount[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [adsets, setAdsets] = useState<AdSet[]>([])
  const [ads, setAds] = useState<Ad[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('contas')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [insightsLoaded, setInsightsLoaded] = useState<boolean>(false)
  const [datePreset, setDatePreset] = useState<string>('today')
  const [customRange, setCustomRange] = useState<DateRange | undefined>()
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState<boolean>(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState<boolean>(false)
  const [insights, setInsights] = useState<any[]>([])
   const [selectedMetrics, setSelectedMetrics] = useState<MetricOption[]>([
     // Identificação
     {
       id: 'name',
       label: 'Nome',
       description: 'Nome da campanha/conjunto/anúncio',
       iconColor: 'text-gray-600',
       type: 'text',
       category: 'Identificação',
       visible: true,
       order: 1
     },
     {
       id: 'status',
       label: 'Status',
       description: 'Status da campanha/conjunto/anúncio',
       iconColor: 'text-gray-600',
       type: 'text',
       category: 'Identificação',
       visible: true,
       order: 2
     },
     {
       id: 'objective',
       label: 'Objetivo',
       description: 'Objetivo da campanha',
       iconColor: 'text-gray-600',
       type: 'text',
       category: 'Identificação',
       visible: true,
       order: 3
     },
     {
       id: 'created_time',
       label: 'Criado em',
       description: 'Data de criação',
       iconColor: 'text-gray-600',
       type: 'text',
       category: 'Identificação',
       visible: true,
       order: 4
     },
     
     // Orçamento e Gastos
     {
       id: 'daily_budget',
       label: 'Orçamento Diário',
       description: 'Orçamento diário da campanha',
       iconColor: 'text-green-600',
       type: 'currency',
       category: 'Orçamento e Gastos',
       visible: true,
       order: 5
     },
     {
       id: 'spend',
       label: 'Valor Gasto',
       description: 'Valor total gasto na campanha',
       iconColor: 'text-red-600',
       type: 'currency',
       category: 'Orçamento e Gastos',
       visible: true,
       order: 6
     },
     
     // Performance e Engajamento
     {
       id: 'impressions',
       label: 'Impressões',
       description: 'Número total de impressões',
       iconColor: 'text-amber-600',
       type: 'number',
       category: 'Performance e Engajamento',
       visible: true,
       order: 7
     },
     {
       id: 'clicks',
       label: 'Cliques',
       description: 'Número de cliques em seus anúncios',
       iconColor: 'text-blue-600',
       type: 'number',
       category: 'Performance e Engajamento',
       visible: true,
       order: 8
     },
     {
       id: 'reach',
       label: 'Alcance',
       description: 'Número de pessoas únicas alcançadas',
       iconColor: 'text-lime-600',
       type: 'number',
       category: 'Performance e Engajamento',
       visible: true,
       order: 9
     },
     {
       id: 'frequency',
       label: 'Frequência',
       description: 'Média de vezes que cada pessoa viu o anúncio',
       iconColor: 'text-yellow-600',
       type: 'number',
       category: 'Performance e Engajamento',
       visible: true,
       order: 10
     },
     {
       id: 'ctr',
       label: 'CTR',
       description: 'Taxa de cliques no link',
       iconColor: 'text-cyan-600',
       type: 'percentage',
       category: 'Performance e Engajamento',
       visible: true,
       order: 11
     },
     {
       id: 'cpm',
       label: 'CPM',
       description: 'Custo por 1.000 impressões',
       iconColor: 'text-teal-600',
       type: 'currency',
       category: 'Performance e Engajamento',
       visible: true,
       order: 12
     },
     {
       id: 'cpc',
       label: 'CPC',
       description: 'Custo por clique no link',
       iconColor: 'text-emerald-600',
       type: 'currency',
       category: 'Performance e Engajamento',
       visible: true,
       order: 13
     },
     
     // Resultados e Conversões
     {
       id: 'conversions',
       label: 'Resultados',
       description: 'Número total de conversões',
       iconColor: 'text-blue-600',
       type: 'number',
       category: 'Resultados e Conversões',
       visible: true,
       order: 14
     },
     {
       id: 'cost_per_conversion',
       label: 'Custo por Resultado (CPA)',
       description: 'Custo por conversão',
       iconColor: 'text-orange-600',
       type: 'currency',
       category: 'Resultados e Conversões',
       visible: true,
       order: 15
     }
   ])

  const tabs = [
    { id: 'contas', label: 'Contas', icon: BarChart3 },
    { id: 'campanhas', label: 'Campanhas', icon: Target },
    { id: 'conjuntos', label: 'Conjuntos', icon: TrendingUp },
    { id: 'anuncios', label: 'Anúncios', icon: MousePointer }
  ]

  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (accounts.length > 0) {
      if (!selectedAccount) {
        setSelectedAccount(accounts[0].id)
      }
      fetchInsights()
    }
  }, [accounts, datePreset, customRange])

  useEffect(() => {
    if (selectedAccount) {
      fetchData()
    }
  }, [selectedAccount, activeTab])


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
      setInsightsLoaded(true)
    } catch (error) {
      console.error('Error fetching insights:', error)
      setInsightsLoaded(true) // Marcar como carregado mesmo em caso de erro
    }
  }

  const fetchData = async () => {
    if (!selectedAccount) return

    try {
      switch (activeTab) {
        case 'campanhas':
          await fetchCampaigns()
          break
        case 'conjuntos':
          await fetchAdsets()
          break
        case 'anuncios':
          await fetchAds()
          break
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erro ao carregar dados')
    }
  }

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`/api/campaigns?accountId=${selectedAccount}`, {
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        console.log('✅ Campanhas carregadas:', data.campaigns?.length || 0)
        setCampaigns(data.campaigns || [])
      } else {
        console.error('❌ Failed to fetch campaigns:', data.message || 'Erro desconhecido')
        toast.error(data.message || 'Erro ao carregar campanhas')
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast.error('Erro ao carregar campanhas')
    }
  }

  const fetchAdsets = async () => {
    try {
      const response = await fetch(`/api/adsets?accountId=${selectedAccount}`, {
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        console.log('✅ Conjuntos de anúncios carregados:', data.adsets?.length || 0)
        setAdsets(data.adsets || [])
      } else {
        console.error('❌ Failed to fetch adsets:', data.message || 'Erro desconhecido')
        toast.error(data.message || 'Erro ao carregar conjuntos de anúncios')
      }
    } catch (error) {
      console.error('Error fetching adsets:', error)
      toast.error('Erro ao carregar conjuntos de anúncios')
    }
  }

  const fetchAds = async () => {
    try {
      const response = await fetch(`/api/ads?accountId=${selectedAccount}`, {
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        console.log('✅ Anúncios carregados:', data.ads?.length || 0)
        setAds(data.ads || [])
      } else {
        console.error('❌ Failed to fetch ads:', data.message || 'Erro desconhecido')
        toast.error(data.message || 'Erro ao carregar anúncios')
      }
    } catch (error) {
      console.error('Error fetching ads:', error)
      toast.error('Erro ao carregar anúncios')
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setInsightsLoaded(false) // Reset insights loaded state
    await fetchAccounts()
    await fetchInsights()
    if (selectedAccount) {
      await fetchData()
    }
    setIsRefreshing(false)
    toast.success('Dados atualizados!')
  }

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset)
    setInsightsLoaded(false) // Reset insights loaded state when date changes
    if (preset !== 'custom') {
      setCustomRange(undefined)
    }
  }

  const handleCustomRangeChange = (range: DateRange) => {
    setCustomRange(range)
    setInsightsLoaded(false) // Reset insights loaded state when date changes
  }

  const handleMetricsChange = (newMetrics: MetricOption[]) => {
    setSelectedMetrics(newMetrics)
    toast.success('Configuração de métricas salva!')
  }

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set())
    } else {
      const currentItems = getCurrentItems()
      setSelectedItems(new Set(currentItems.map(item => item.id)))
    }
    setSelectAll(!selectAll)
  }

  const getCurrentItems = () => {
    switch (activeTab) {
      case 'campanhas': return campaigns
      case 'conjuntos': return adsets
      case 'anuncios': return ads
      default: return []
    }
  }

  const handleInlineBudgetSave = async (type: 'campaign' | 'adset', id: string, newBudget: number, budgetType: 'daily_budget' | 'lifetime_budget') => {
    const endpoint = type === 'campaign' ? 'campaigns' : 'adsets'
    
    try {
      const response = await fetch(`/api/${endpoint}/${id}/budget`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          budget: newBudget,
          budgetType: budgetType
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Orçamento atualizado com sucesso!')
        await fetchData() // Recarregar dados
      } else {
        toast.error(data.message || 'Erro ao atualizar orçamento')
      }
    } catch (error) {
      console.error('Error updating budget:', error)
      toast.error('Erro ao atualizar orçamento')
    }
  }

  const handleToggleStatus = async (type: 'campaign' | 'adset' | 'ad', id: string, newStatus: 'ACTIVE' | 'PAUSED') => {
    const endpoint = type === 'campaign' ? 'campaigns' : type === 'adset' ? 'adsets' : 'ads'
    
    try {
      const response = await fetch(`/api/${endpoint}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`${newStatus === 'ACTIVE' ? 'Ativado' : 'Pausado'} com sucesso!`)
        await fetchData() // Recarregar dados
      } else {
        toast.error(data.message || 'Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
  }

  const handleStatusChange = async (type: 'campaign' | 'adset' | 'ad', id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    const endpoint = type === 'campaign' ? 'campaigns' : type === 'adset' ? 'adsets' : 'ads'
    
    try {
      const response = await fetch(`/api/${endpoint}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`${newStatus === 'ACTIVE' ? 'Ativado' : 'Pausado'} com sucesso!`)
        await fetchData() // Recarregar dados
      } else {
        toast.error(data.message || 'Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const handleBudgetChange = async (type: 'campaign' | 'adset', id: string, currentBudget: number, budgetType: 'daily_budget' | 'lifetime_budget') => {
    const newBudget = prompt(`Digite o novo ${budgetType === 'daily_budget' ? 'orçamento diário' : 'orçamento total'} (R$):`, currentBudget.toString())
    
    if (!newBudget || isNaN(parseFloat(newBudget))) {
      toast.error('Valor inválido')
      return
    }

    const budgetValue = parseFloat(newBudget)
    const endpoint = type === 'campaign' ? 'campaigns' : 'adsets'
    
    try {
      const response = await fetch(`/api/${endpoint}/${id}/budget`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          budget: budgetValue,
          budgetType: budgetType
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Orçamento atualizado com sucesso!')
        await fetchData() // Recarregar dados
      } else {
        toast.error(data.message || 'Erro ao atualizar orçamento')
      }
    } catch (error) {
      console.error('Error updating budget:', error)
      toast.error('Erro ao atualizar orçamento')
    }
  }

  const formatCurrency = (value: number) => {
    return `R$ ${(value / 100).toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

   const formatMetricValue = (item: any, metric: MetricOption) => {
     // Métricas que vêm dos insights (performance)
     const performanceMetrics = [
       'impressions', 'clicks', 'spend', 'reach', 'frequency', 'cpm', 'cpc', 'ctr', 
       'conversions', 'cost_per_conversion', 'inline_link_clicks', 'inline_post_engagement', 
       'conversion_rate', 'roas', 'roi', 'link_clicks', 'landing_page_views',
       'actions_purchase', 'cost_per_action_type_purchase', 'conversion_values_purchase'
     ]
     
     let value = item[metric.id]
     
     // Se for uma métrica de performance, buscar nos insights
     if (performanceMetrics.includes(metric.id)) {
       const insightData = insights.find(insight => {
         // Mapear o tipo de item para o campo correto nos insights
         if (activeTab === 'campanhas') {
           return insight.campaign_id === item.id
         } else if (activeTab === 'conjuntos') {
           return insight.adset_id === item.id
         } else if (activeTab === 'anuncios') {
           return insight.ad_id === item.id
         }
         return false
       })
       
       if (insightData) {
         // Lidar com métricas aninhadas
         if (metric.id === 'actions_purchase') {
           // Buscar ações de compra específicas
           if (insightData.actions) {
             const purchaseAction = insightData.actions.find((action: any) => 
               action.action_type === 'purchase' || action.action_type === 'offsite_conversion'
             )
             value = purchaseAction ? purchaseAction.value : 0
           }
         } else if (metric.id === 'cost_per_action_type_purchase') {
           // Buscar custo por ação de compra
           if (insightData.cost_per_action_type) {
             const purchaseCost = insightData.cost_per_action_type.find((cost: any) => 
               cost.action_type === 'purchase' || cost.action_type === 'offsite_conversion'
             )
             value = purchaseCost ? purchaseCost.value : 0
           }
         } else if (metric.id === 'conversion_values_purchase') {
           // Buscar valor de conversão de compra
           if (insightData.conversion_values) {
             const purchaseValue = insightData.conversion_values.find((conv: any) => 
               conv.action_type === 'purchase' || conv.action_type === 'offsite_conversion'
             )
             value = purchaseValue ? purchaseValue.value : 0
           }
         } else {
           // Métricas simples
           value = insightData[metric.id]
         }
       }
     }
     
     if (value === undefined || value === null || value === '') {
       return '-'
     }

     switch (metric.type) {
       case 'currency':
         if (metric.id === 'daily_budget' || metric.id === 'lifetime_budget') {
           const budgetValue = typeof value === 'number' ? value / 100 : parseFloat(value) / 100 || 0
           const budgetType = metric.id === 'daily_budget' ? 'daily_budget' : 'lifetime_budget'
           const itemType = activeTab === 'campanhas' ? 'campaign' : 'adset'
           
           return (
             <InlineBudgetEditor
               value={budgetValue}
               onSave={(newValue) => handleInlineBudgetSave(itemType, item.id, newValue, budgetType)}
             />
           )
         }
         // Para métricas de moeda, dividir por 100 se necessário (API retorna em centavos)
         const currencyValue = typeof value === 'number' ? value : parseFloat(value) || 0
         return formatCurrency(currencyValue)
       case 'percentage':
         return `${parseFloat(value).toFixed(2)}%`
       case 'number':
         return parseInt(value).toLocaleString()
       case 'text':
       default:
         if (metric.id === 'status') {
           return (
             <StatusToggle
               status={value}
               onToggle={(newStatus) => {
                 const itemType = activeTab === 'campanhas' ? 'campaign' : 
                                 activeTab === 'conjuntos' ? 'adset' : 'ad'
                 handleToggleStatus(itemType, item.id, newStatus)
               }}
             />
           )
         }
         if (metric.id === 'created_time') {
           return formatDate(value)
         }
         return value.toString()
     }
   }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-100'
      case 'PAUSED':
        return 'text-yellow-600 bg-yellow-100'
      case 'DELETED':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (isLoading || !insightsLoaded) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {isLoading ? 'Carregando Meta Manager...' : 'Carregando dados de performance...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Meta Manager
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Gerenciamento avançado de campanhas do Facebook
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Atualizado há 1 minuto
                </span>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="btn-primary flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Atualizar</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Filtros */}
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome da Campanha:
                </label>
                <input
                  type="text"
                  placeholder="Filtrar por nome"
                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status da Campanha:
                </label>
                <select className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Qualquer</option>
                  <option>Ativa</option>
                  <option>Pausada</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Período de Visualização:
                </label>
                <DateSelector
                  datePreset={datePreset}
                  customRange={customRange}
                  onDatePresetChange={handleDatePresetChange}
                  onCustomRangeChange={handleCustomRangeChange}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Conta de Anúncio:
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={() => setIsMetricsModalOpen(true)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Configurar Métricas</span>
              </button>
            </div>
          </div>
        </header>

        {/* Tabs Navigation */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as TabType)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {activeTab === 'contas' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Contas Integradas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accounts.map((account) => (
                    <div key={account.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{account.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">ID: {account.id}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {account.status === 'active' ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'campanhas' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Campanhas ({campaigns.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <TableCheckbox
                            checked={selectAll}
                            onChange={handleSelectAll}
                            indeterminate={selectedItems.size > 0 && selectedItems.size < campaigns.length}
                          />
                        </th>
                        {selectedMetrics
                          .filter(metric => metric.visible)
                          .sort((a, b) => a.order - b.order)
                          .map((metric) => (
                            <th 
                              key={metric.id}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                              <div className="flex items-center space-x-1">
                                <span>{metric.label}</span>
                                <div className="flex flex-col">
                                  <svg className="w-2 h-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                  </svg>
                                  <svg className="w-2 h-2 text-gray-400 -mt-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {campaigns.map((campaign) => (
                        <tr key={campaign.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedItems.has(campaign.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <TableCheckbox
                              checked={selectedItems.has(campaign.id)}
                              onChange={() => handleSelectItem(campaign.id)}
                            />
                          </td>
                          {selectedMetrics
                            .filter(metric => metric.visible)
                            .sort((a, b) => a.order - b.order)
                            .map((metric) => (
                              <td 
                                key={metric.id}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                              >
                                {formatMetricValue(campaign, metric)}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'conjuntos' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Conjuntos de Anúncios ({adsets.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <TableCheckbox
                            checked={selectAll}
                            onChange={handleSelectAll}
                            indeterminate={selectedItems.size > 0 && selectedItems.size < adsets.length}
                          />
                        </th>
                        {selectedMetrics
                          .filter(metric => metric.visible)
                          .sort((a, b) => a.order - b.order)
                          .map((metric) => (
                            <th 
                              key={metric.id}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                              <div className="flex items-center space-x-1">
                                <span>{metric.label}</span>
                                <div className="flex flex-col">
                                  <svg className="w-2 h-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                  </svg>
                                  <svg className="w-2 h-2 text-gray-400 -mt-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {adsets.map((adset) => (
                        <tr key={adset.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedItems.has(adset.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <TableCheckbox
                              checked={selectedItems.has(adset.id)}
                              onChange={() => handleSelectItem(adset.id)}
                            />
                          </td>
                          {selectedMetrics
                            .filter(metric => metric.visible)
                            .sort((a, b) => a.order - b.order)
                            .map((metric) => (
                              <td 
                                key={metric.id}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                              >
                                {formatMetricValue(adset, metric)}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'anuncios' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Anúncios ({ads.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <TableCheckbox
                            checked={selectAll}
                            onChange={handleSelectAll}
                            indeterminate={selectedItems.size > 0 && selectedItems.size < ads.length}
                          />
                        </th>
                        {selectedMetrics
                          .filter(metric => metric.visible)
                          .sort((a, b) => a.order - b.order)
                          .map((metric) => (
                            <th 
                              key={metric.id}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                            >
                              <div className="flex items-center space-x-1">
                                <span>{metric.label}</span>
                                <div className="flex flex-col">
                                  <svg className="w-2 h-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                  </svg>
                                  <svg className="w-2 h-2 text-gray-400 -mt-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {ads.map((ad) => (
                        <tr key={ad.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedItems.has(ad.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <TableCheckbox
                              checked={selectedItems.has(ad.id)}
                              onChange={() => handleSelectItem(ad.id)}
                            />
                          </td>
                          {selectedMetrics
                            .filter(metric => metric.visible)
                            .sort((a, b) => a.order - b.order)
                            .map((metric) => (
                              <td 
                                key={metric.id}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                              >
                                {formatMetricValue(ad, metric)}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Modal Unificado de Métricas */}
      <UnifiedMetricsModal
        isOpen={isMetricsModalOpen}
        onClose={() => setIsMetricsModalOpen(false)}
        metrics={selectedMetrics}
        onSave={handleMetricsChange}
        title="Personalize as colunas"
        description="Escolha como você quer visualizar as colunas na tabela."
      />
    </div>
  )
}
