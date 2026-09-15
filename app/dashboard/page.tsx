'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import StatsCard from '@/components/dashboard/StatsCard'
import DateSelector, { DateRange } from '@/components/dashboard/DateSelector'
import { useApp } from '@/contexts/AppContext'
import { useDebounce } from '@/lib/debounce'
import {
  readLocalCache,
  writeLocalCache,
  LOCAL_CACHE_KEYS
} from '@/lib/local-storage-cache'
import toast from 'react-hot-toast'

interface DashboardMetrics {
  // Métricas Financeiras — todas calculadas a partir de dados REAIS vindos da Meta (Graph/Marketing
  // API), nunca simuladas. "revenue" vem do campo conversion_values das campanhas (valor de compra
  // rastreado pelo Pixel/API de Conversões da Meta, o mesmo dado já exibido na coluna "Valor das
  // Conversões" da aba Campanhas) — ver seção 34 do doc do projeto. Não existe fonte de vendas fora
  // da Meta neste projeto (sem integração de checkout/pagamento), então isso é o dado real mais
  // próximo de "vendas" disponível hoje.
  totalSpend: number
  revenue: number
  roas: number | null
  profit: number
  roi: number | null
  margin: number | null
  averageTicket: number | null

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
    revenue: 0,
    roas: null,
    profit: 0,
    roi: null,
    margin: null,
    averageTicket: null,
    totalCampaigns: 0,
    activeCampaigns: 0,
    pausedCampaigns: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0
  })
  
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  // Período de data COMPARTILHADO com a tela Meta Business (lib/local-storage-cache.ts) —
  // selecionar um período aqui também vale lá, e vice-versa. Sem nada salvo ainda, abre com
  // "Hoje" (padrão pedido pelo usuário — ver seção 12 do doc do projeto), em vez de "Últimos 30
  // dias" — período mais pesado, que junto com a busca eager abaixo contribuía mais pro rate
  // limit da Meta.
  const sharedDateFilter = useState(() =>
    readLocalCache<{ datePreset: string; customRange?: DateRange }>(LOCAL_CACHE_KEYS.sharedDateFilter)
  )[0]
  const [datePreset, setDatePreset] = useState(() => sharedDateFilter?.data.datePreset || 'today')
  const [customRange, setCustomRange] = useState<DateRange | undefined>(() =>
    sharedDateFilter?.data.datePreset ? sharedDateFilter.data.customRange : undefined
  )

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsRefreshing(true)
      // Não filtra mais por account_status (status real da conta perante a Meta, ex.: "Restrita")
      // — só o toggle habilitar/desabilitar de Integrações (sync_enabled) decide quais contas
      // entram aqui, e isso já foi aplicado no AppContext (enabledOnly=true). Ver mesmo ajuste em
      // app/meta-business/page.tsx.
      const activeAccounts = accounts

      if (activeAccounts.length === 0) {
        toast.error('Nenhuma conta habilitada encontrada')
        return
      }

      // Buscar dados de todas as contas ativas
      let totalSpend = 0
      let totalRevenue = 0
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
            
            // Somar métricas — tudo dado real vindo da Meta, nada calculado/estimado aqui.
            // "conversion_values" é o valor de compra que o Pixel/API de Conversões da Meta atribuiu
            // àquela campanha (mesmo campo já exibido em "Valor das Conversões" na aba Campanhas).
            campaigns.forEach((campaign: any) => {
              totalSpend += campaign.spend || 0
              totalRevenue += campaign.conversion_values || 0
              totalImpressions += campaign.impressions || 0
              totalClicks += campaign.clicks || 0
              totalConversions += campaign.conversions || 0
            })
          }
        } catch (error) {
          console.error(`Error fetching data for account ${account.id}:`, error)
        }
      }

      // Métricas derivadas — todas calculadas em cima de totalSpend/totalRevenue/totalConversions
      // reais, sem nenhum multiplicador fixo (ver seção 34 do doc do projeto).
      const revenue = totalRevenue
      const profit = revenue - totalSpend
      const roas = totalSpend > 0 ? revenue / totalSpend : null
      const roi = totalSpend > 0 ? (profit / totalSpend) * 100 : null
      const margin = revenue > 0 ? (profit / revenue) * 100 : null
      const averageTicket = totalConversions > 0 ? revenue / totalConversions : null

      setMetrics({
        totalSpend,
        revenue,
        roas,
        profit,
        roi,
        margin,
        averageTicket,
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
      return
    }
    // Nenhuma conta conectada (ex.: usuário removeu todos os perfis em Integrações) — zera as
    // métricas em vez de deixar os últimos valores buscados nesta mesma sessão presos na tela.
    // Mesmo bug de interferência já corrigido na tela Meta Business (ver seção 41 do doc do
    // projeto), aplicado aqui por consistência.
    setMetrics({
      totalSpend: 0,
      revenue: 0,
      roas: null,
      profit: 0,
      roi: null,
      margin: null,
      averageTicket: null,
      totalCampaigns: 0,
      activeCampaigns: 0,
      pausedCampaigns: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0
    })
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
      writeLocalCache(LOCAL_CACHE_KEYS.sharedDateFilter, { datePreset: preset, customRange: undefined })
    }
  }

  const handleCustomRangeChange = (range: DateRange) => {
    setCustomRange(range)
    writeLocalCache(LOCAL_CACHE_KEYS.sharedDateFilter, { datePreset: 'custom', customRange: range })
  }

  // Sincroniza o período de data em tempo real quando ele é alterado em OUTRA aba/tela
  // (ex.: Meta Business) — o evento 'storage' só dispara nas abas que NÃO fizeram a escrita.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LOCAL_CACHE_KEYS.sharedDateFilter || !event.newValue) return
      try {
        const parsed = JSON.parse(event.newValue) as { data: { datePreset: string; customRange?: DateRange } }
        setDatePreset(parsed.data.datePreset)
        setCustomRange(parsed.data.customRange)
      } catch (error) {
        console.warn('⚠️ Falha ao ler período de data compartilhado:', error)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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
            <RefreshCw className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-4" />
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
            className="space-y-8"
          >
            {/* Resumo — KPIs principais: o que eu preciso saber primeiro */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Resumo
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Gastos com Anúncios"
                  value={formatCurrency(metrics.totalSpend)}
                  trend={metrics.totalSpend > 0 ? 'up' : 'neutral'}
                />
                <StatsCard
                  title="Vendas (Receita)"
                  value={formatCurrency(metrics.revenue)}
                  trend={metrics.revenue > 0 ? 'up' : 'neutral'}
                />
                <StatsCard
                  title="ROAS"
                  value={formatPercentage(metrics.roas)}
                  trend={metrics.roas && metrics.roas > 3 ? 'up' : 'neutral'}
                />
                <StatsCard
                  title="Lucro"
                  value={formatCurrency(metrics.profit)}
                  trend={metrics.profit > 0 ? 'up' : 'down'}
                />
              </div>
            </section>

            {/* Indicadores derivados — peso visual menor que o Resumo acima */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Indicadores Derivados
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="ROI"
                  value={formatPercentage(metrics.roi)}
                  size="secondary"
                  trend={metrics.roi && metrics.roi > 0 ? 'up' : 'down'}
                />
                <StatsCard
                  title="Margem"
                  value={formatPercentage(metrics.margin)}
                  size="secondary"
                  trend={metrics.margin && metrics.margin > 20 ? 'up' : 'neutral'}
                />
                <StatsCard
                  title="Conversões (Vendas)"
                  value={metrics.totalConversions.toLocaleString()}
                  size="secondary"
                  trend={metrics.totalConversions > 0 ? 'up' : 'neutral'}
                />
                <StatsCard
                  title="Ticket Médio"
                  value={metrics.averageTicket !== null ? formatCurrency(metrics.averageTicket) : 'N/A'}
                  size="secondary"
                  trend="neutral"
                />
              </div>
            </section>

            {/* Operação — visão rápida de campanhas/impressões/cliques */}
            <section className="card p-6">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Resumo de Performance
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y divide-gray-100 dark:divide-gray-700 md:divide-y-0 md:divide-x">
                <div className="text-center md:px-4 pb-4 md:pb-0">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {metrics.totalCampaigns}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Total de Campanhas
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {metrics.activeCampaigns} ativas • {metrics.pausedCampaigns} pausadas
                  </div>
                </div>
                <div className="text-center md:px-4 py-4 md:py-0">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {metrics.totalImpressions.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Total de Impressões
                  </div>
                </div>
                <div className="text-center md:px-4 pt-4 md:pt-0">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {metrics.totalClicks.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Total de Cliques
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
