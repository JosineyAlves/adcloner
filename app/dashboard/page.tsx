'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  ShoppingCart, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calculator,
  Receipt,
  CreditCard,
  BarChart3
} from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import StatsCard from '@/components/dashboard/StatsCard'
import DateSelector, { DateRange } from '@/components/dashboard/DateSelector'
import { useApp } from '@/contexts/AppContext'
import { useDebounce } from '@/lib/debounce'
import toast from 'react-hot-toast'

interface DashboardMetrics {
  // Métricas Financeiras
  totalSpend: number
  pendingSales: number
  roas: number | null
  profit: number
  refundedSales: number
  tax: number
  roi: number | null
  productCosts: number
  margin: number | null
  chargebackRate: number
  additionalExpenses: number
  fees: number
  
  // Métricas de Performance
  totalCampaigns: number
  activeCampaigns: number
  pausedCampaigns: number
  totalImpressions: number
  totalClicks: number
  totalConversions: number
}

export default function DashboardPage() {
  const { accounts, isLoading: accountsLoading, refreshAccounts } = useApp()
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSpend: 0,
    pendingSales: 0,
    roas: null,
    profit: 0,
    refundedSales: 0,
    tax: 0,
    roi: null,
    productCosts: 0,
    margin: null,
    chargebackRate: 0,
    additionalExpenses: 0,
    fees: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    pausedCampaigns: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0
  })
  
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [datePreset, setDatePreset] = useState<string>('last_30d')
  const [customRange, setCustomRange] = useState<DateRange | undefined>()

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const activeAccounts = accounts.filter(a => a.status === 'active')
      
      if (activeAccounts.length === 0) {
        toast.error('Nenhuma conta ativa encontrada')
        return
      }

      // Buscar dados de todas as contas ativas
      let totalSpend = 0
      let totalImpressions = 0
      let totalClicks = 0
      let totalConversions = 0
      let totalCampaigns = 0
      let activeCampaigns = 0
      let pausedCampaigns = 0

      for (const account of activeAccounts) {
        try {
          // Buscar campanhas
          const campaignsResponse = await fetch(`/api/meta-business/campaigns?accountId=${account.id}&datePreset=${datePreset}${customRange ? `&since=${customRange.since}&until=${customRange.until}` : ''}`, {
            credentials: 'include'
          })
          
          if (campaignsResponse.ok) {
            const campaignsData = await campaignsResponse.json()
            const campaigns = campaignsData.campaigns || []
            
            totalCampaigns += campaigns.length
            activeCampaigns += campaigns.filter((c: any) => c.status === 'ACTIVE').length
            pausedCampaigns += campaigns.filter((c: any) => c.status === 'PAUSED').length
            
            // Somar métricas
            campaigns.forEach((campaign: any) => {
              totalSpend += campaign.spend || 0
              totalImpressions += campaign.impressions || 0
              totalClicks += campaign.clicks || 0
              totalConversions += campaign.conversions || 0
            })
          }
        } catch (error) {
          console.error(`Error fetching data for account ${account.id}:`, error)
        }
      }

      // Calcular métricas derivadas
      const revenue = totalSpend * 3.5 // Simulação: ROAS médio de 3.5
      const profit = revenue - totalSpend
      const roas = totalSpend > 0 ? revenue / totalSpend : null
      const roi = totalSpend > 0 ? (profit / totalSpend) * 100 : null
      const margin = revenue > 0 ? (profit / revenue) * 100 : null

      setMetrics({
        totalSpend,
        pendingSales: revenue * 0.1, // 10% das vendas pendentes
        roas,
        profit,
        refundedSales: revenue * 0.05, // 5% de reembolsos
        tax: revenue * 0.1, // 10% de impostos
        roi,
        productCosts: revenue * 0.3, // 30% custos de produto
        margin,
        chargebackRate: 0.5, // 0.5% chargeback
        additionalExpenses: totalSpend * 0.1, // 10% despesas adicionais
        fees: totalSpend * 0.05, // 5% taxas
        totalCampaigns,
        activeCampaigns,
        pausedCampaigns,
        totalImpressions,
        totalClicks,
        totalConversions
      })
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Erro ao carregar dados do dashboard')
    } finally {
      setIsRefreshing(false)
    }
  }, [accounts, datePreset, customRange])

  // Ref para evitar dependências desnecessárias
  const fetchDashboardDataRef = useRef(fetchDashboardData)
  fetchDashboardDataRef.current = fetchDashboardData

  // Debounce da função fetchDashboardData para evitar múltiplos refreshs
  const debouncedFetchDashboardData = useDebounce('dashboard-fetch', fetchDashboardData, 3000)

  useEffect(() => {
    if (accounts.length > 0) {
      // Usar ref para evitar dependência circular
      fetchDashboardDataRef.current()
    }
  }, [accounts, datePreset, customRange])

  const handleRefresh = useDebounce('dashboard-refresh', async () => {
    await refreshAccounts()
    await debouncedFetchDashboardData()
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercentage = (value: number | null) => {
    if (value === null) return 'N/A'
    return `${value.toFixed(1)}%`
  }

  if (accountsLoading) {
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
                Dashboard Financeiro
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Visão geral das métricas financeiras e de performance das campanhas
              </p>
            </div>
            <div className="flex items-center space-x-3">
                <DateSelector
                  datePreset={datePreset}
                  customRange={customRange}
                  onDatePresetChange={handleDatePresetChange}
                  onCustomRangeChange={handleCustomRangeChange}
                />
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
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Métricas Financeiras Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Gastos com Anúncios"
                value={formatCurrency(metrics.totalSpend)}
                icon={DollarSign}
                iconColor="text-red-600"
                trend={metrics.totalSpend > 0 ? 'up' : 'neutral'}
              />
              <StatsCard
                title="Vendas Pendentes"
                value={formatCurrency(metrics.pendingSales)}
                icon={AlertCircle}
                iconColor="text-yellow-600"
                trend="neutral"
              />
              <StatsCard
                title="ROAS"
                value={formatPercentage(metrics.roas)}
                icon={TrendingUp}
                iconColor="text-green-600"
                trend={metrics.roas && metrics.roas > 3 ? 'up' : 'neutral'}
              />
              <StatsCard
                title="Lucro"
                value={formatCurrency(metrics.profit)}
                icon={CheckCircle}
                iconColor="text-emerald-600"
                trend={metrics.profit > 0 ? 'up' : 'down'}
              />
                </div>

            {/* Métricas Financeiras Secundárias */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Vendas Reembolsadas"
                value={formatCurrency(metrics.refundedSales)}
                icon={XCircle}
                iconColor="text-red-500"
                trend="down"
              />
              <StatsCard
                title="Imposto"
                value={formatCurrency(metrics.tax)}
                icon={Receipt}
                iconColor="text-orange-600"
                trend="neutral"
              />
              <StatsCard
                title="ROI"
                value={formatPercentage(metrics.roi)}
                icon={Percent}
                iconColor="text-blue-600"
                trend={metrics.roi && metrics.roi > 0 ? 'up' : 'down'}
              />
              <StatsCard
                title="Custos de Produto"
                value={formatCurrency(metrics.productCosts)}
                icon={ShoppingCart}
                iconColor="text-purple-600"
                trend="neutral"
              />
            </div>

            {/* Métricas de Margem e Taxas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Margem"
                value={formatPercentage(metrics.margin)}
                icon={Calculator}
                iconColor="text-indigo-600"
                trend={metrics.margin && metrics.margin > 20 ? 'up' : 'neutral'}
              />
              <StatsCard
                title="Chargeback"
                value={`${metrics.chargebackRate}%`}
                icon={CreditCard}
                iconColor="text-red-500"
                trend={metrics.chargebackRate < 1 ? 'up' : 'down'}
              />
              <StatsCard
                title="Despesas Adicionais"
                value={formatCurrency(metrics.additionalExpenses)}
                icon={BarChart3}
                iconColor="text-gray-600"
                trend="neutral"
              />
                          <StatsCard
                title="Taxas"
                value={formatCurrency(metrics.fees)}
                icon={Receipt}
                iconColor="text-gray-500"
                trend="neutral"
              />
            </div>

            {/* Resumo de Performance */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Resumo de Performance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {metrics.totalCampaigns}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total de Campanhas
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {metrics.activeCampaigns} ativas • {metrics.pausedCampaigns} pausadas
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {metrics.totalImpressions.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total de Impressões
                      </div>
                    </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {metrics.totalClicks.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total de Cliques
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
} 
