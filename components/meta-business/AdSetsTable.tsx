'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  Pause, 
  Archive, 
  DollarSign, 
  Settings, 
  Check, 
  X,
  AlertCircle,
  Target,
  ChevronDown,
  Filter
} from 'lucide-react'
import { MetaAdSet } from '@/lib/types'
import { MetricConfig } from '@/lib/metrics-config'
import StatusToggle from './StatusToggle'
import BudgetEditor from './BudgetEditor'
import BidEditor from './BidEditor'
import NameEditor from './NameEditor'
import ColumnResizeHandle from './ColumnResizeHandle'
import MetricsColumn from './MetricsColumn'
import { useTableSort } from '@/hooks/useTableSort'
import { useResizableColumns } from '@/hooks/useResizableColumns'
import { BID_AMOUNT_STRATEGIES } from '@/lib/bid-strategies'
import toast from 'react-hot-toast'

interface AdSetsTableProps {
  adSets: MetaAdSet[]
  selectedAdSets: Set<string>
  onSelectionChange: (selected: Set<string>) => void
  onStatusToggle: (type: 'campaigns' | 'adsets' | 'ads', id: string, currentStatus: string) => void
  onBudgetUpdate: (type: 'campaigns' | 'adsets', id: string, budget: number, budgetType: 'daily' | 'lifetime') => void
  onBidUpdate: (id: string, bidAmount: number) => void
  onNameUpdate: (type: 'campaigns' | 'adsets' | 'ads', id: string, name: string) => void
  onBulkStatusUpdate: (type: 'campaigns' | 'adsets' | 'ads', status: string) => void
  onBulkBidUpdate: (ids: string[], bidAmount: number) => Promise<void>
  metrics?: MetricConfig[]
  showMetrics?: boolean
}

interface RatioMetricConfig {
  numerator: string
  denominator: string
  multiplier?: number
}

export default function AdSetsTable({
  adSets,
  selectedAdSets,
  onSelectionChange,
  onStatusToggle,
  onBudgetUpdate,
  onBidUpdate,
  onNameUpdate,
  onBulkStatusUpdate,
  onBulkBidUpdate,
  metrics = [],
  showMetrics = false
}: AdSetsTableProps) {
  
  // Debug: verificar métricas recebidas
  console.log('📊 AdSetsTable - Métricas recebidas:', metrics.filter(m => m.visible).map(m => m.label))
  console.log('📊 AdSetsTable - showMetrics:', showMetrics)

  // Barra de ação em massa — menu "Ações" (Ativar/Desativar/Alterar limite de lance/Filtrar
  // selecionados), no estilo Ads Manager/Ratoeira/UTMify: um botão só, o resto vive dentro do
  // menu suspenso ou de um popover pequeno (nunca dois blocos concorrendo na mesma barra).
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false)
  const [bulkBidPopoverOpen, setBulkBidPopoverOpen] = useState(false)
  const [filterToSelectedOnly, setFilterToSelectedOnly] = useState(false)
  const [bulkBidValue, setBulkBidValue] = useState('')
  const [isBulkBidUpdating, setIsBulkBidUpdating] = useState(false)

  // Limpa menu/popover/filtro quando a seleção esvazia (ex. depois de uma ação em massa bem
  // sucedida), pra não reaparecerem "presos" abertos numa seleção futura.
  useEffect(() => {
    if (selectedAdSets.size === 0) {
      setBulkMenuOpen(false)
      setBulkBidPopoverOpen(false)
      setFilterToSelectedOnly(false)
    }
  }, [selectedAdSets.size])

  // Funções de formatação
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const formatMetricValue = (value: any, type: 'number' | 'currency' | 'percentage', metricId?: string) => {
    if (value === null || value === undefined) return '-'

    const numValue = typeof value === 'number' ? value : parseFloat(value)

    if (isNaN(numValue)) return '-'

    // Frequência e ROAS de Compra: arredonda pra 2 casas decimais (ex.: 1.185 -> "1.19", 1.053 ->
    // "1.05"), igual ao Gerenciador de Anúncios nativo — o formatNumber genérico abaixo deixava
    // até 3 casas por padrão.
    if (metricId === 'frequency' || metricId === 'purchase_roas') return numValue.toFixed(2)

    switch (type) {
      case 'currency':
        return formatCurrency(numValue)
      case 'percentage':
        return formatPercentage(numValue)
      default:
        return formatNumber(numValue)
    }
  }

  // Linha de totais no rodapé — mesmo padrão de CampaignsTable.tsx.
  const visibleMetrics = metrics.filter(m => m.visible)
  const totalBudget = adSets.reduce(
    (sum, a) => sum + (a.daily_budget || a.lifetime_budget || 0),
    0
  )
  // Metricas de razao (custo-por-X, CTR-familia, ROAS, frequencia): somar ou fazer media simples
  // das linhas esta matematicamente errado - ex.: CPM do total NAO e a soma dos CPMs de cada
  // linha. O correto, e o que o proprio Gerenciador de Anuncios da Meta faz na linha de totais, e
  // recalcular a razao a partir dos totais reais de numerador/denominador das linhas visiveis
  // (ex.: total gasto / total de impressoes * 1000 para CPM). `multiplier` cobre os casos que nao
  // sao uma razao direta (CPM x1000, CTRs em % x100).
  const RATIO_METRICS: Record<string, RatioMetricConfig> = {
    cpc: { numerator: 'spend', denominator: 'clicks' },
    cost_per_inline_link_click: { numerator: 'spend', denominator: 'inline_link_clicks' },
    cpm: { numerator: 'spend', denominator: 'impressions', multiplier: 1000 },
    cost_per_conversion: { numerator: 'spend', denominator: 'conversions' },
    cost_per_initiate_checkout: { numerator: 'spend', denominator: 'initiate_checkout' },
    cost_per_landing_page_view: { numerator: 'spend', denominator: 'landing_page_view' },
    purchase_roas: { numerator: 'conversion_values', denominator: 'spend' },
    frequency: { numerator: 'impressions', denominator: 'reach' },
    ctr: { numerator: 'clicks', denominator: 'impressions', multiplier: 100 },
    unique_ctr: { numerator: 'unique_clicks', denominator: 'reach', multiplier: 100 },
    inline_link_click_ctr: { numerator: 'inline_link_clicks', denominator: 'impressions', multiplier: 100 },
    unique_inline_link_click_ctr: { numerator: 'unique_inline_link_clicks', denominator: 'reach', multiplier: 100 },

    // Funil de vídeo (Hook/Body/CTA) — ver lib/metrics-config.ts pras fórmulas e descrições.
    video_hook_rate: { numerator: 'video_views_3s', denominator: 'impressions', multiplier: 100 },
    video_hook_retention: { numerator: 'video_views_3s', denominator: 'video_play_actions', multiplier: 100 },
    video_hook_play_rate: { numerator: 'video_play_actions', denominator: 'impressions', multiplier: 100 },
    video_body_retention: { numerator: 'video_p75_watched_actions', denominator: 'video_play_actions', multiplier: 100 },
    video_body_conversion: { numerator: 'conversions', denominator: 'video_p75_watched_actions', multiplier: 100 },
    video_cta_rate: { numerator: 'inline_link_clicks', denominator: 'video_p75_watched_actions', multiplier: 100 }
  }

  const metricTotals = visibleMetrics.map((metric) => {
    const ratio = RATIO_METRICS[metric.id]
    if (ratio) {
      let totalNumerator = 0
      let totalDenominator = 0
      let hasData = false
      for (const row of adSets) {
        const num = (row as any)[ratio.numerator]
        const den = (row as any)[ratio.denominator]
        if (typeof num === 'number' && !isNaN(num)) {
          totalNumerator += num
          hasData = true
        }
        if (typeof den === 'number' && !isNaN(den)) totalDenominator += den
      }
      if (!hasData || totalDenominator === 0) return null
      return (totalNumerator / totalDenominator) * (ratio.multiplier ?? 1)
    }

    const values = adSets
      .map((a) => (a as any)[metric.id])
      .map((v) => (typeof v === 'number' ? v : parseFloat(v)))
      .filter((v) => !isNaN(v))
    if (values.length === 0) return null
    const sum = values.reduce((s, v) => s + v, 0)
    return metric.type === 'percentage' ? sum / values.length : sum
  })

  // Ordenação por coluna (clique no cabeçalho) — ver hooks/useTableSort.ts.
  const { sortConfig, handleSort, sortedRows: sortedAdSets } = useTableSort<MetaAdSet>(
    adSets,
    'name',
    (row, key) => (key === 'budget' ? row.daily_budget || row.lifetime_budget || 0 : (row as any)[key])
  )

  // Largura ajustável (arrastar + duplo-clique pra ajustar ao conteúdo) das colunas Nome,
  // Orçamento e de cada métrica visível — ver hooks/useResizableColumns.ts.
  const { getWidth, startResize, autoFit, resizingId } = useResizableColumns('adsets')
  const nameColWidth = getWidth('name', 240)
  const budgetColWidth = getWidth('budget', 140)
  const handleAutoFitName = () => autoFit('name', [...adSets.map(a => a.name), 'Conjunto'])
  const handleAutoFitBudget = () => autoFit('budget', [
    ...adSets.map(a => a.campaign_advantage_budget ? 'N/A' : formatCurrency(a.daily_budget || a.lifetime_budget || 0)),
    'Orçamento'
  ])
  const bidColWidth = getWidth('bid', 140)
  const handleAutoFitBid = () => autoFit('bid', [
    ...adSets.map(a => a.bid_amount !== undefined ? formatCurrency(a.bid_amount) : 'Automático'),
    'Limite de Lance'
  ])

  // Quantos dos conjuntos selecionados realmente aceitam bid_amount editável (lance manual) —
  // usado pra avisar o usuário quando parte da seleção vai ser ignorada na aplicação em massa.
  const selectedEligibleForBid = Array.from(selectedAdSets).filter(id => {
    const adSet = adSets.find(a => a.id === id)
    return !!adSet?.bid_strategy && BID_AMOUNT_STRATEGIES.has(adSet.bid_strategy)
  }).length

  const handleBulkBidApply = async () => {
    const value = parseFloat(bulkBidValue.replace(',', '.'))
    if (!value || value < 0.01) {
      toast.error('Informe um limite de lance válido (mínimo $0,01)')
      return
    }
    if (selectedEligibleForBid === 0) {
      toast.error('Nenhum conjunto selecionado usa uma estratégia de lance editável')
      return
    }
    setIsBulkBidUpdating(true)
    try {
      await onBulkBidUpdate(Array.from(selectedAdSets), value)
      setBulkBidValue('')
      setBulkBidPopoverOpen(false)
    } finally {
      setIsBulkBidUpdating(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedAdSets.size === adSets.length) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(adSets.map(a => a.id)))
    }
  }

  const handleSelectAdSet = (adSetId: string) => {
    const newSelection = new Set(selectedAdSets)
    if (newSelection.has(adSetId)) {
      newSelection.delete(adSetId)
    } else {
      newSelection.add(adSetId)
    }
    onSelectionChange(newSelection)
  }

  const handleStatusToggle = async (adSetId: string, currentStatus: string) => {
    await onStatusToggle('adsets', adSetId, currentStatus)
  }

  const formatTargeting = (targeting: MetaAdSet['targeting']) => {
    const parts = []
    if (targeting.age_min && targeting.age_max) {
      parts.push(`${targeting.age_min}-${targeting.age_max} anos`)
    }
    if (targeting.geo_locations?.countries?.length) {
      parts.push(targeting.geo_locations.countries.join(', '))
    }
    if (targeting.interests?.length) {
      parts.push(`${targeting.interests.length} interesses`)
    }
    return parts.join(' • ') || 'Sem targeting'
  }

  if (adSets.length === 0) {
    return (
      <div className="space-y-4">
        {/* Cabeçalho da tabela mesmo sem dados */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="md:sticky md:left-0 z-20 w-12 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left align-bottom">
                  <input
                    type="checkbox"
                    disabled
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                </th>
                <th className="md:sticky md:left-12 z-20 w-24 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap align-bottom">
                  Status
                </th>
                <th
                  className="md:sticky md:left-[144px] z-20 bg-gray-50 dark:bg-gray-700 md:shadow-[inset_-2px_0_0_0_rgba(100,116,139,0.4)] md:dark:shadow-[inset_-2px_0_0_0_rgba(148,163,184,0.4)] px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap align-bottom"
                  style={{ width: nameColWidth, minWidth: nameColWidth, maxWidth: nameColWidth }}
                >
                  Conjunto
                  <ColumnResizeHandle
                    onMouseDown={startResize('name', nameColWidth)}
                    onDoubleClick={handleAutoFitName}
                    isResizing={resizingId === 'name'}
                  />
                </th>
                <th
                  className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap align-bottom"
                  style={{ width: budgetColWidth, minWidth: budgetColWidth, maxWidth: budgetColWidth }}
                >
                  Orçamento
                  <ColumnResizeHandle
                    onMouseDown={startResize('budget', budgetColWidth)}
                    onDoubleClick={handleAutoFitBudget}
                    isResizing={resizingId === 'budget'}
                  />
                </th>
                <th
                  className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap align-bottom"
                  style={{ width: bidColWidth, minWidth: bidColWidth, maxWidth: bidColWidth }}
                >
                  Limite de Lance
                  <ColumnResizeHandle
                    onMouseDown={startResize('bid', bidColWidth)}
                    onDoubleClick={handleAutoFitBid}
                    isResizing={resizingId === 'bid'}
                  />
                </th>
                {showMetrics && metrics.filter(m => m.visible).map((metric) => {
                  const metricColWidth = getWidth(metric.id, 150)
                  return (
                    <th
                      key={metric.id}
                      className="relative px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-normal leading-tight align-bottom"
                      style={{ width: metricColWidth, minWidth: metricColWidth, maxWidth: metricColWidth }}
                    >
                      <span title={metric.label} className="block line-clamp-2">{metric.label}</span>
                      <ColumnResizeHandle
                        onMouseDown={startResize(metric.id, metricColWidth)}
                        onDoubleClick={() => autoFit(metric.id, [
                          ...adSets.map(a => formatMetricValue((a as any)[metric.id], metric.type, metric.id)),
                          metric.label
                        ])}
                        isResizing={resizingId === metric.id}
                      />
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800">
              <tr>
                <td colSpan={5 + (showMetrics ? metrics.filter(m => m.visible).length : 0)} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <Target className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Nenhum conjunto encontrado
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Não há conjuntos de anúncios disponíveis para o período selecionado.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">

      {/* Barra de ação em massa — só aparece com alguma seleção. Um único botão "Ações" (padrão
          Ads Manager/Ratoeira/UTMify) abre um menu suspenso; itens que precisam de um valor
          (limite de lance) abrem um popover pequeno à parte, nunca os dois brigando por espaço na
          mesma barra. Escopo atual: Ativar, Desativar, Alterar limite de lance (mesmo valor pra
          todos os selecionados — a edição individual por linha na célula "Limite de Lance"
          continua existindo do mesmo jeito, sem essa substituir aquela) e Filtrar selecionados. */}
      {selectedAdSets.size > 0 && (
        <div className="relative flex flex-wrap items-center gap-3 px-4 py-2 mb-2 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
            {selectedAdSets.size} conjunto{selectedAdSets.size === 1 ? '' : 's'} selecionado{selectedAdSets.size === 1 ? '' : 's'}
          </span>

          {filterToSelectedOnly && (
            <span className="flex items-center gap-1 text-xs font-medium text-brand-700 dark:text-brand-300 bg-brand-100 dark:bg-brand-800/40 px-2 py-0.5 rounded-full whitespace-nowrap">
              <Filter className="w-3 h-3" />
              Filtrado
            </span>
          )}

          <div className="relative">
            <button
              onClick={() => {
                setBulkBidPopoverOpen(false)
                setBulkMenuOpen(prev => !prev)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Ações
              <ChevronDown className={`w-4 h-4 transition-transform ${bulkMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {bulkMenuOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
                <button
                  onClick={() => { onBulkStatusUpdate('adsets', 'ACTIVE'); setBulkMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Play className="w-4 h-4 text-green-600" />
                  Ativar selecionados
                </button>
                <button
                  onClick={() => { onBulkStatusUpdate('adsets', 'PAUSED'); setBulkMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Pause className="w-4 h-4 text-amber-600" />
                  Desativar selecionados
                </button>
                <button
                  onClick={() => { setBulkMenuOpen(false); setBulkBidPopoverOpen(true) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  Alterar limite de lance
                </button>
                <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                <button
                  onClick={() => { setFilterToSelectedOnly(prev => !prev); setBulkMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Filter className="w-4 h-4 text-gray-400" />
                  {filterToSelectedOnly ? 'Remover filtro' : 'Filtrar selecionados'}
                </button>
              </div>
            )}
          </div>

          {/* Popover do limite de lance — flutua perto do botão em vez de ocupar a barra toda
              (mesmo padrão do "Bid Cap" da UTMify: um campo, Cancelar/Aplicar). */}
          {bulkBidPopoverOpen && (
            <div className="absolute top-full left-24 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-3">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Limite de lance (para {selectedAdSets.size} conjunto{selectedAdSets.size === 1 ? '' : 's'}
                {selectedEligibleForBid !== selectedAdSets.size ? `, ${selectedEligibleForBid} com lance editável` : ''})
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={bulkBidValue}
                onChange={(e) => setBulkBidValue(e.target.value)}
                disabled={isBulkBidUpdating}
                autoFocus
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 mb-2"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => { setBulkBidPopoverOpen(false); setBulkBidValue('') }}
                  disabled={isBulkBidUpdating}
                  className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBulkBidApply}
                  disabled={isBulkBidUpdating || !bulkBidValue}
                  className="px-3 py-1 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                >
                  {isBulkBidUpdating ? 'Aplicando...' : 'Aplicar'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabela — altura limitada com rolagem própria (max-h + overflow-y-auto) para que a linha
          de totais no rodapé possa ficar fixa (sticky) enquanto as linhas passam por baixo dela. */}
      {/* Área de rolagem única (horizontal + vertical) — a tentativa de separar isso em dois
          contêineres não resolveu o leve efeito visual de "colunas se empurrando" no scroll
          lateral (é um comportamento residual do próprio navegador ao combinar cabeçalho fixo +
          colunas fixas, sem impacto funcional), então voltamos à versão mais simples: flex-1
          min-h-0 continua fazendo a tabela ocupar exatamente a primeira dobra disponível. */}
      <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
        <table className="min-w-full">
          <thead className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="md:sticky md:left-0 z-20 w-12 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left align-bottom">
                <input
                  type="checkbox"
                  checked={selectedAdSets.size === adSets.length && adSets.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
              </th>
              <th className="md:sticky md:left-12 z-20 w-24 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap align-bottom">
                Status
              </th>
              <th
                onClick={() => handleSort('name')}
                title={sortConfig?.key === 'name' ? `Ordenado ${sortConfig.direction === 'asc' ? 'A→Z' : 'Z→A'} — clique para inverter` : 'Clique para ordenar'}
                className={`md:sticky md:left-[144px] z-20 bg-gray-50 dark:bg-gray-700 md:shadow-[inset_-2px_0_0_0_rgba(100,116,139,0.4)] md:dark:shadow-[inset_-2px_0_0_0_rgba(148,163,184,0.4)] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap align-bottom cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 ${sortConfig?.key === 'name' ? 'text-brand-600 dark:text-brand-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}
                style={{ width: nameColWidth, minWidth: nameColWidth, maxWidth: nameColWidth }}
              >
                Conjunto
                <ColumnResizeHandle
                  onMouseDown={startResize('name', nameColWidth)}
                  onDoubleClick={handleAutoFitName}
                  isResizing={resizingId === 'name'}
                />
              </th>
              <th
                onClick={() => handleSort('budget')}
                title={sortConfig?.key === 'budget' ? `Ordenado ${sortConfig.direction === 'asc' ? 'menor→maior' : 'maior→menor'} — clique para inverter` : 'Clique para ordenar'}
                className={`relative px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap align-bottom cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 ${sortConfig?.key === 'budget' ? 'text-brand-600 dark:text-brand-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}
                style={{ width: budgetColWidth, minWidth: budgetColWidth, maxWidth: budgetColWidth }}
              >
                Orçamento
                <ColumnResizeHandle
                  onMouseDown={startResize('budget', budgetColWidth)}
                  onDoubleClick={handleAutoFitBudget}
                  isResizing={resizingId === 'budget'}
                />
              </th>
              <th
                onClick={() => handleSort('bid_amount')}
                title={sortConfig?.key === 'bid_amount' ? `Ordenado ${sortConfig.direction === 'asc' ? 'menor→maior' : 'maior→menor'} — clique para inverter` : 'Clique para ordenar'}
                className={`relative px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap align-bottom cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 ${sortConfig?.key === 'bid_amount' ? 'text-brand-600 dark:text-brand-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}
                style={{ width: bidColWidth, minWidth: bidColWidth, maxWidth: bidColWidth }}
              >
                Limite de Lance
                <ColumnResizeHandle
                  onMouseDown={startResize('bid', bidColWidth)}
                  onDoubleClick={handleAutoFitBid}
                  isResizing={resizingId === 'bid'}
                />
              </th>
              {showMetrics && metrics.filter(m => m.visible).map((metric) => {
                const metricColWidth = getWidth(metric.id, 150)
                return (
                  <th
                    key={metric.id}
                    onClick={() => handleSort(metric.id)}
                    title={`${metric.label} — ${sortConfig?.key === metric.id ? `ordenado ${sortConfig.direction === 'asc' ? 'menor→maior' : 'maior→menor'}, clique para inverter` : 'clique para ordenar'}`}
                    className={`relative px-3 py-3 text-left text-xs font-medium uppercase tracking-normal leading-tight align-bottom cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 ${sortConfig?.key === metric.id ? 'text-brand-600 dark:text-brand-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}
                    style={{ width: metricColWidth, minWidth: metricColWidth, maxWidth: metricColWidth }}
                  >
                    <span className="block line-clamp-2">{metric.label}</span>
                    <ColumnResizeHandle
                      onMouseDown={startResize(metric.id, metricColWidth)}
                      onDoubleClick={() => autoFit(metric.id, [
                        ...adSets.map(a => formatMetricValue((a as any)[metric.id], metric.type, metric.id)),
                        metric.label
                      ])}
                      isResizing={resizingId === metric.id}
                    />
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {(filterToSelectedOnly ? sortedAdSets.filter(a => selectedAdSets.has(a.id)) : sortedAdSets).map((adSet) => (
              <tr key={adSet.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="md:sticky md:left-0 z-10 w-12 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectedAdSets.has(adSet.id)}
                    onChange={() => handleSelectAdSet(adSet.id)}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                </td>
                <td className="md:sticky md:left-12 z-10 w-24 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 px-6 py-3">
                  <StatusToggle
                    id={adSet.id}
                    status={adSet.status}
                    effectiveStatus={adSet.effective_status}
                    onToggle={handleStatusToggle}
                    disabled={adSet.status === 'ARCHIVED'}
                    size="md"
                  />
                </td>
                <td className="md:sticky md:left-[144px] z-10 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 md:shadow-[inset_-2px_0_0_0_rgba(100,116,139,0.25)] md:dark:shadow-[inset_-2px_0_0_0_rgba(148,163,184,0.3)] px-6 py-3" style={{ width: nameColWidth, minWidth: nameColWidth, maxWidth: nameColWidth }}>
                  <NameEditor
                    id={adSet.id}
                    currentName={adSet.name}
                    onUpdate={async (id, name) => {
                      const response = await fetch(`/api/meta-business/adsets/${id}/name`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name,
                          accountId: adSet.account_id
                        })
                      })

                      const result = await response.json()

                      if (result.success) {
                        onNameUpdate('adsets', id, name)
                      } else {
                        const error = new Error(result.error || 'Erro ao atualizar nome')
                        ;(error as any).error = result.error
                        throw error
                      }
                    }}
                  />
                </td>
                <td className="px-6 py-3" style={{ width: budgetColWidth, minWidth: budgetColWidth, maxWidth: budgetColWidth }}>
                  {adSet.campaign_advantage_budget ? (
                    // Campanha-pai usa CBO (Advantage Campaign Budget) — o orçamento vive na
                    // Campaign, o Ad Set não tem orçamento próprio pra editar (mesmo padrão de
                    // "Definido no conjunto" usado em AdsTable.tsx para anúncios).
                    <span className="text-sm font-medium text-gray-400 dark:text-gray-500" title="Esta campanha usa CBO — o orçamento é definido no nível da Campanha">
                      N/A
                    </span>
                  ) : (
                    <BudgetEditor
                      id={adSet.id}
                      currentBudget={adSet.daily_budget || adSet.lifetime_budget || 0}
                      budgetType={adSet.budget_type}
                      onUpdate={async (id, budget, budgetType) => {
                        try {
                          const response = await fetch(`/api/meta-business/adsets/${id}/budget`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              budget: budget,
                              budgetType,
                              // Deixa o servidor resolver o token da conexão dona dessa conta em
                              // vez de só o cookie único — ver lib/meta-connections.ts.
                              accountId: adSet.account_id
                            })
                          })

                          const result = await response.json()

                          if (result.success) {
                            onBudgetUpdate('adsets', id, budget, budgetType)
                          } else {
                            const error = new Error(result.error || 'Erro ao atualizar orçamento')
                            ;(error as any).error = result.error
                            throw error
                          }
                        } catch (error) {
                          console.error('Erro ao atualizar orçamento:', error)
                          throw error
                        }
                      }}
                      disabled={false}
                      minValue={0.01}
                      maxValue={10000000}
                      isCBO={adSet.campaign_advantage_budget}
                      level="adset"
                    />
                  )}
                </td>
                <td className="px-6 py-3" style={{ width: bidColWidth, minWidth: bidColWidth, maxWidth: bidColWidth }}>
                  <BidEditor
                    id={adSet.id}
                    currentBid={adSet.bid_amount}
                    bidStrategy={adSet.bid_strategy}
                    onUpdate={async (id, bidAmount) => {
                      const response = await fetch(`/api/meta-business/adsets/${id}/bid`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          bidAmount,
                          bidStrategy: adSet.bid_strategy,
                          // Mesmo padrão do BudgetEditor — deixa o servidor resolver o token da
                          // conexão dona dessa conta (ver lib/meta-connections.ts).
                          accountId: adSet.account_id
                        })
                      })

                      const result = await response.json()

                      if (result.success) {
                        onBidUpdate(id, bidAmount)
                      } else {
                        const error = new Error(result.error || 'Erro ao atualizar limite de lance')
                        ;(error as any).error = result.error
                        throw error
                      }
                    }}
                    disabled={false}
                    minValue={0.01}
                    maxValue={10000000}
                  />
                </td>
                {showMetrics && metrics.filter(m => m.visible).map((metric) => {
                  const value = (adSet as any)[metric.id]
                  const formattedValue = formatMetricValue(value, metric.type, metric.id)
                  const metricColWidth = getWidth(metric.id, 150)
                  return (
                    <td key={metric.id} className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap" style={{ width: metricColWidth, minWidth: metricColWidth, maxWidth: metricColWidth }}>
                      {formattedValue}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="sticky bottom-0 z-20 md:left-0 w-12 bg-gray-200 dark:bg-black border-t-[3px] border-gray-400 dark:border-gray-400 px-6 py-3"></td>
              <td className="sticky bottom-0 z-20 md:left-12 w-24 bg-gray-200 dark:bg-black border-t-[3px] border-gray-400 dark:border-gray-400 px-6 py-3"></td>
              <td className="sticky bottom-0 z-20 md:left-[144px] bg-gray-200 dark:bg-black border-t-[3px] border-gray-400 dark:border-gray-400 md:shadow-[inset_-2px_0_0_0_rgba(100,116,139,0.25)] md:dark:shadow-[inset_-2px_0_0_0_rgba(148,163,184,0.3)] px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap" style={{ width: nameColWidth, minWidth: nameColWidth, maxWidth: nameColWidth }}>
                {adSets.length} {adSets.length === 1 ? 'CONJUNTO' : 'CONJUNTOS'}
              </td>
              <td className="sticky bottom-0 z-10 bg-gray-200 dark:bg-black border-t-[3px] border-gray-400 dark:border-gray-400 px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap" style={{ width: budgetColWidth, minWidth: budgetColWidth, maxWidth: budgetColWidth }}>
                {totalBudget > 0 ? formatCurrency(totalBudget) : '-'}
              </td>
              <td className="sticky bottom-0 z-10 bg-gray-200 dark:bg-black border-t-[3px] border-gray-400 dark:border-gray-400 px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap" style={{ width: bidColWidth, minWidth: bidColWidth, maxWidth: bidColWidth }}>
                -
              </td>
              {showMetrics && visibleMetrics.map((metric, index) => {
                const metricColWidth = getWidth(metric.id, 150)
                return (
                  <td key={metric.id} className="sticky bottom-0 z-10 bg-gray-200 dark:bg-black border-t-[3px] border-gray-400 dark:border-gray-400 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap" style={{ width: metricColWidth, minWidth: metricColWidth, maxWidth: metricColWidth }}>
                    {metricTotals[index] === null ? '-' : formatMetricValue(metricTotals[index], metric.type, metric.id)}
                  </td>
                )
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
