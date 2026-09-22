'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import PageHeader from '@/components/layout/PageHeader'
import StatsCard from '@/components/dashboard/StatsCard'
import DateSelector, { DateRange } from '@/components/dashboard/DateSelector'
import Select from '@/components/ui/Select'
import BreakdownBarChart from '@/components/dashboard/BreakdownBarChart'
import { useApp } from '@/contexts/AppContext'
import { useDebounce } from '@/lib/debounce'
import {
  readLocalCache,
  writeLocalCache,
  LOCAL_CACHE_KEYS
} from '@/lib/local-storage-cache'
import toast from 'react-hot-toast'

interface BreakdownRow {
  label: string
  value: number
}

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
  cpa: number | null
  epc: number | null

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
    cpa: null,
    epc: null,
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

  // Filtro por Conta de Anúncio — mesmo campo e mesmas opções ("Todas as Contas" + uma por
  // conta) usados no Meta Ads, pra padronizar. Vazio = agrega todas as contas habilitadas
  // (comportamento de antes, quando esse filtro não existia).
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')

  // Vendas por País/Hora/Dia da Semana — breakdowns nativos da Insights API do Meta (ver
  // lib/facebook-batch-api.ts:createAccountInsightsBreakdownBatch). O valor exibido é
  // conversion_values (receita atribuída), a mesma métrica usada em "Vendas (Receita)" acima,
  // só que segmentada por dimensão.
  const [countryBreakdown, setCountryBreakdown] = useState<BreakdownRow[]>([])
  const [hourBreakdown, setHourBreakdown] = useState<BreakdownRow[]>([])
  const [weekdayBreakdown, setWeekdayBreakdown] = useState<BreakdownRow[]>([])
  // Plataforma (Facebook/Instagram/Audience Network/Messenger), Posicionamento (Feed/Stories/
  // Reels/etc.) e Idade — mesmos breakdowns nativos, mesma rota (/insights-breakdown já retorna
  // os 6 num único fetch por conta).
  const [platformBreakdown, setPlatformBreakdown] = useState<BreakdownRow[]>([])
  const [placementBreakdown, setPlacementBreakdown] = useState<BreakdownRow[]>([])
  const [ageBreakdown, setAgeBreakdown] = useState<BreakdownRow[]>([])
  // Mobile vs. Desktop — device_platform, único breakdown de dispositivo que a Meta suporta
  // sozinho (impression_device precisaria combinar com publisher_platform, mas o pedido aqui foi
  // especificamente a visão simples Mobile/Desktop).
  const [deviceBreakdown, setDeviceBreakdown] = useState<BreakdownRow[]>([])
  const [breakdownsLoading, setBreakdownsLoading] = useState<boolean>(false)

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsRefreshing(true)
      // Não filtra mais por account_status (status real da conta perante a Meta, ex.: "Restrita")
      // — só o toggle habilitar/desabilitar de Integrações (sync_enabled) decide quais contas
      // entram aqui, e isso já foi aplicado no AppContext (enabledOnly=true). Ver mesmo ajuste em
      // app/meta-business/page.tsx. Além disso, se o usuário escolheu uma conta específica no
      // filtro "Conta de Anúncio", as métricas passam a considerar só ela.
      const activeAccounts = selectedAccountId
        ? accounts.filter((account) => account.id === selectedAccountId)
        : accounts

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
      // CPA (Custo por Aquisição) — quanto custou, em média, cada conversão. EPC (Earnings per
      // Click / Receita por Clique) — quanto cada clique gerou de receita em média. Ambos nativos:
      // só dividem totalSpend/revenue reais já calculados acima, sem nenhuma métrica nova buscada
      // da Meta.
      const cpa = totalConversions > 0 ? totalSpend / totalConversions : null
      const epc = totalClicks > 0 ? revenue / totalClicks : null

      setMetrics({
        totalSpend,
        revenue,
        roas,
        profit,
        roi,
        margin,
        averageTicket,
        cpa,
        epc,
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
  }, [accounts, datePreset, customRange, selectedAccountId])

  // Busca os 3 breakdowns nativos (País/Hora/Dia da Semana) em paralelo por conta — cada conta
  // já é 1 única chamada de batch da Meta (3 sub-requisições numa só requisição HTTP, ver a rota),
  // então N contas = N chamadas extras, não N×3. Mescla os resultados de todas as contas ativas
  // somando por rótulo (país/hora/dia), igual ao que fetchDashboardData já faz para os totais.
  const fetchBreakdownData = useCallback(async () => {
    const activeAccounts = selectedAccountId
      ? accounts.filter((account) => account.id === selectedAccountId)
      : accounts

    if (activeAccounts.length === 0) {
      setCountryBreakdown([])
      setHourBreakdown([])
      setWeekdayBreakdown([])
      return
    }

    setBreakdownsLoading(true)
    try {
      const countryTotals = new Map<string, number>()
      const hourTotals = new Map<string, number>()
      const weekdayTotals = new Map<string, number>()
      const platformTotals = new Map<string, number>()
      const placementTotals = new Map<string, number>()
      const ageTotals = new Map<string, number>()
      const deviceTotals = new Map<string, number>()

      await Promise.all(
        activeAccounts.map(async (account) => {
          try {
            const response = await fetch(
              `/api/meta-business/insights-breakdown?accountId=${account.id}&datePreset=${datePreset}${customRange ? `&since=${customRange.since}&until=${customRange.until}` : ''}`,
              { credentials: 'include' }
            )
            if (!response.ok) return
            const data = await response.json()

            for (const row of data.country || []) {
              countryTotals.set(row.label, (countryTotals.get(row.label) || 0) + (row.conversionValues || 0))
            }
            for (const row of data.hour || []) {
              hourTotals.set(row.label, (hourTotals.get(row.label) || 0) + (row.conversionValues || 0))
            }
            for (const row of data.weekday || []) {
              weekdayTotals.set(row.label, (weekdayTotals.get(row.label) || 0) + (row.conversionValues || 0))
            }
            for (const row of data.platform || []) {
              platformTotals.set(row.label, (platformTotals.get(row.label) || 0) + (row.conversionValues || 0))
            }
            for (const row of data.placement || []) {
              placementTotals.set(row.label, (placementTotals.get(row.label) || 0) + (row.conversionValues || 0))
            }
            for (const row of data.age || []) {
              ageTotals.set(row.label, (ageTotals.get(row.label) || 0) + (row.conversionValues || 0))
            }
            for (const row of data.device || []) {
              deviceTotals.set(row.label, (deviceTotals.get(row.label) || 0) + (row.conversionValues || 0))
            }
          } catch (error) {
            console.error(`Error fetching breakdowns for account ${account.id}:`, error)
          }
        })
      )

      setCountryBreakdown(
        Array.from(countryTotals.entries())
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
      )

      const hourOrder = (label: string) => parseInt(label, 10)
      setHourBreakdown(
        Array.from(hourTotals.entries())
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => hourOrder(a.label) - hourOrder(b.label))
      )

      const WEEKDAY_ORDER = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      setWeekdayBreakdown(
        Array.from(weekdayTotals.entries())
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => WEEKDAY_ORDER.indexOf(a.label) - WEEKDAY_ORDER.indexOf(b.label))
      )

      setPlatformBreakdown(
        Array.from(platformTotals.entries())
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
      )
      setPlacementBreakdown(
        Array.from(placementTotals.entries())
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
      )
      // Idade ordena pela própria faixa (18-24, 25-34, ...) em vez de por valor, senão a leitura
      // de "qual faixa cresce/qual cai" fica difícil ao trocar o período.
      const AGE_ORDER = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+']
      setAgeBreakdown(
        Array.from(ageTotals.entries())
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => AGE_ORDER.indexOf(a.label) - AGE_ORDER.indexOf(b.label))
      )

      setDeviceBreakdown(
        Array.from(deviceTotals.entries())
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
      )
    } finally {
      setBreakdownsLoading(false)
    }
  }, [accounts, datePreset, customRange, selectedAccountId])

  // Ref para evitar dependências desnecessárias
  const fetchDashboardDataRef = useRef(fetchDashboardData)
  fetchDashboardDataRef.current = fetchDashboardData

  const fetchBreakdownDataRef = useRef(fetchBreakdownData)
  fetchBreakdownDataRef.current = fetchBreakdownData

  // Debounce da função fetchDashboardData para evitar múltiplos refreshs
  const debouncedFetchDashboardData = useDebounce('dashboard-fetch', fetchDashboardData, 3000)
  const debouncedFetchBreakdownData = useDebounce('dashboard-fetch-breakdowns', fetchBreakdownData, 3000)

  useEffect(() => {
    if (accounts.length > 0) {
      // Usar ref para evitar dependência circular
      fetchDashboardDataRef.current()
      fetchBreakdownDataRef.current()
      return
    }
    setCountryBreakdown([])
    setHourBreakdown([])
    setWeekdayBreakdown([])
    setPlatformBreakdown([])
    setPlacementBreakdown([])
    setAgeBreakdown([])
    setDeviceBreakdown([])
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
      cpa: null,
      epc: null,
      totalCampaigns: 0,
      activeCampaigns: 0,
      pausedCampaigns: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0
    })
  }, [accounts, datePreset, customRange, selectedAccountId])

  const handleRefresh = useDebounce('dashboard-refresh', async () => {
    await refreshAccounts()
    await Promise.all([debouncedFetchDashboardData(), debouncedFetchBreakdownData()])
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
        <main className="flex-1 overflow-y-auto pt-3 px-4 md:px-6 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* PageHeader e o card de filtros logo abaixo ficam com um espaçamento próprio bem
                mais justo (space-y-3) do que o space-y-8 usado entre as demais seções da página
                — são duas peças do mesmo "cabeçalho" da tela (identidade + filtros), não duas
                seções de conteúdo distintas, então não faz sentido a mesma folga generosa usada
                para separar Resumo/Gráficos/etc. */}
            <div className="space-y-3">
              <PageHeader title="Dashboard Financeiro" />

              {/* Filtros + Atualizar — mesmo padrão de card e mesmos rótulos/ordem usados no
                  Meta Ads (Conta de Anúncio, Data), pra ficar consistente entre as duas telas. As
                  ferramentas de dados ficam junto do conteúdo que afetam, não no cabeçalho da
                  página (ver PageHeader), seguindo a referência da UTMify. */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Conta de Anúncio
                  </label>
                  <Select
                    value={selectedAccountId}
                    onChange={setSelectedAccountId}
                    options={[
                      { value: '', label: 'Todas as Contas' },
                      ...accounts.map((account) => ({ value: account.id, label: account.name }))
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Data
                  </label>
                  <DateSelector
                    datePreset={datePreset}
                    customRange={customRange}
                    onDatePresetChange={handleDatePresetChange}
                    onCustomRangeChange={handleCustomRangeChange}
                  />
                </div>
              </div>

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="btn-primary flex items-center space-x-2 px-3 py-1.5"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
              </div>
            </div>

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
                <StatsCard
                  title="CPA"
                  value={metrics.cpa !== null ? formatCurrency(metrics.cpa) : 'N/A'}
                  size="secondary"
                  trend="neutral"
                />
                <StatsCard
                  title="EPC"
                  value={metrics.epc !== null ? formatCurrency(metrics.epc) : 'N/A'}
                  size="secondary"
                  trend="neutral"
                />
              </div>
            </section>

            {/* Vendas por Dimensão — breakdowns nativos da Meta Insights API (país/hora/dia da
                semana), mostrando onde a receita atribuída (conversion_values) se concentra.
                Ver lib/facebook-batch-api.ts:createAccountInsightsBreakdownBatch. */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Vendas por Dimensão
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Vendas por País</h3>
                  {breakdownsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <BreakdownBarChart data={countryBreakdown} valueFormatter={formatCurrency} maxItems={6} />
                  )}
                </div>
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Vendas por Hora</h3>
                  {breakdownsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <BreakdownBarChart data={hourBreakdown} valueFormatter={formatCurrency} maxItems={6} />
                  )}
                </div>
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Vendas por Dia da Semana</h3>
                  {breakdownsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <BreakdownBarChart data={weekdayBreakdown} valueFormatter={formatCurrency} />
                  )}
                </div>
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Vendas por Plataforma</h3>
                  {breakdownsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <BreakdownBarChart data={platformBreakdown} valueFormatter={formatCurrency} />
                  )}
                </div>
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Vendas por Posicionamento</h3>
                  {breakdownsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <BreakdownBarChart data={placementBreakdown} valueFormatter={formatCurrency} maxItems={6} />
                  )}
                </div>
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Vendas por Idade</h3>
                  {breakdownsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <BreakdownBarChart data={ageBreakdown} valueFormatter={formatCurrency} />
                  )}
                </div>
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Vendas por Dispositivo</h3>
                  {breakdownsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <BreakdownBarChart data={deviceBreakdown} valueFormatter={formatCurrency} />
                  )}
                </div>
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
