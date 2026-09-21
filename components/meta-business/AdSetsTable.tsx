'use client'

import { useState } from 'react'
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
  Target
} from 'lucide-react'
import { MetaAdSet } from '@/lib/types'
import { MetricConfig } from '@/lib/metrics-config'
import StatusToggle from './StatusToggle'
import BudgetEditor from './BudgetEditor'
import NameEditor from './NameEditor'
import MetricsColumn from './MetricsColumn'
import { useTableSort } from '@/hooks/useTableSort'
import { useColumnResize } from '@/hooks/useColumnResize'
import toast from 'react-hot-toast'

interface AdSetsTableProps {
  adSets: MetaAdSet[]
  selectedAdSets: Set<string>
  onSelectionChange: (selected: Set<string>) => void
  onStatusToggle: (type: 'campaigns' | 'adsets' | 'ads', id: string, currentStatus: string) => void
  onBudgetUpdate: (type: 'campaigns' | 'adsets', id: string, budget: number, budgetType: 'daily' | 'lifetime') => void
  onNameUpdate: (type: 'campaigns' | 'adsets' | 'ads', id: string, name: string) => void
  onBulkStatusUpdate: (type: 'campaigns' | 'adsets' | 'ads', status: string) => void
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
  onNameUpdate,
  onBulkStatusUpdate,
  metrics = [],
  showMetrics = false
}: AdSetsTableProps) {
  
  // Debug: verificar métricas recebidas
  console.log('📊 AdSetsTable - Métricas recebidas:', metrics.filter(m => m.visible).map(m => m.label))
  console.log('📊 AdSetsTable - showMetrics:', showMetrics)

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

  // Largura ajustável (arrastar) da coluna "Nome" — ver hooks/useColumnResize.ts.
  const { width: nameColWidth, isResizing: isResizingNameCol, handleMouseDown: handleNameColResizeStart } = useColumnResize('adsets:name')

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
                <th className="sticky left-0 z-20 w-12 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left align-bottom">
                  <input
                    type="checkbox"
                    disabled
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                </th>
                <th className="sticky left-12 z-20 w-24 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap align-bottom">
                  Status
                </th>
                <th
                  className="sticky left-[144px] z-20 bg-gray-50 dark:bg-gray-700 shadow-[inset_-2px_0_0_0_rgba(100,116,139,0.4)] dark:shadow-[inset_-2px_0_0_0_rgba(148,163,184,0.4)] px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap align-bottom"
                  style={{ width: nameColWidth, minWidth: nameColWidth, maxWidth: nameColWidth }}
                >
                  Conjunto
                  <div
                    onMouseDown={handleNameColResizeStart}
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute top-0 right-0 h-full w-1.5 cursor-col-resize select-none z-10 ${isResizingNameCol ? 'bg-brand-500/70' : 'hover:bg-brand-400/50'}`}
                    title="Arraste para redimensionar"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap align-bottom">
                  Orçamento
                </th>
                {showMetrics && metrics.filter(m => m.visible).map((metric) => (
                  <th key={metric.id} className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-normal min-w-[130px] max-w-[220px] leading-tight align-bottom">
                    <span title={metric.label} className="block line-clamp-2">{metric.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800">
              <tr>
                <td colSpan={4 + (showMetrics ? metrics.filter(m => m.visible).length : 0)} className="px-6 py-12 text-center">
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
              <th className="sticky left-0 z-20 w-12 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left align-bottom">
                <input
                  type="checkbox"
                  checked={selectedAdSets.size === adSets.length && adSets.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
              </th>
              <th className="sticky left-12 z-20 w-24 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap align-bottom">
                Status
              </th>
              <th
                onClick={() => handleSort('name')}
                title={sortConfig?.key === 'name' ? `Ordenado ${sortConfig.direction === 'asc' ? 'A→Z' : 'Z→A'} — clique para inverter` : 'Clique para ordenar'}
                className={`sticky left-[144px] z-20 bg-gray-50 dark:bg-gray-700 shadow-[inset_-2px_0_0_0_rgba(100,116,139,0.4)] dark:shadow-[inset_-2px_0_0_0_rgba(148,163,184,0.4)] px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap align-bottom cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 ${sortConfig?.key === 'name' ? 'text-brand-600 dark:text-brand-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}
                style={{ width: nameColWidth, minWidth: nameColWidth, maxWidth: nameColWidth }}
              >
                Conjunto
                  <div
                    onMouseDown={handleNameColResizeStart}
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute top-0 right-0 h-full w-1.5 cursor-col-resize select-none z-10 ${isResizingNameCol ? 'bg-brand-500/70' : 'hover:bg-brand-400/50'}`}
                    title="Arraste para redimensionar"
                  />
              </th>
              <th
                onClick={() => handleSort('budget')}
                title={sortConfig?.key === 'budget' ? `Ordenado ${sortConfig.direction === 'asc' ? 'menor→maior' : 'maior→menor'} — clique para inverter` : 'Clique para ordenar'}
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap align-bottom cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 ${sortConfig?.key === 'budget' ? 'text-brand-600 dark:text-brand-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Orçamento
              </th>
              {showMetrics && metrics.filter(m => m.visible).map((metric) => (
                <th
                  key={metric.id}
                  onClick={() => handleSort(metric.id)}
                  title={`${metric.label} — ${sortConfig?.key === metric.id ? `ordenado ${sortConfig.direction === 'asc' ? 'menor→maior' : 'maior→menor'}, clique para inverter` : 'clique para ordenar'}`}
                  className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-normal min-w-[130px] max-w-[220px] leading-tight align-bottom cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 ${sortConfig?.key === metric.id ? 'text-brand-600 dark:text-brand-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  <span className="block line-clamp-2">{metric.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedAdSets.map((adSet) => (
              <tr key={adSet.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="sticky left-0 z-10 w-12 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectedAdSets.has(adSet.id)}
                    onChange={() => handleSelectAdSet(adSet.id)}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                </td>
                <td className="sticky left-12 z-10 w-24 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 px-6 py-3">
                  <StatusToggle
                    id={adSet.id}
                    status={adSet.status}
                    effectiveStatus={adSet.effective_status}
                    onToggle={handleStatusToggle}
                    disabled={adSet.status === 'ARCHIVED'}
                    size="md"
                  />
                </td>
                <td className="sticky left-[144px] z-10 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 shadow-[inset_-2px_0_0_0_rgba(100,116,139,0.25)] dark:shadow-[inset_-2px_0_0_0_rgba(148,163,184,0.3)] px-6 py-3" style={{ width: nameColWidth, minWidth: nameColWidth, maxWidth: nameColWidth }}>
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
                <td className="px-6 py-3">
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
                {showMetrics && metrics.filter(m => m.visible).map((metric) => {
                  const value = (adSet as any)[metric.id]
                  const formattedValue = formatMetricValue(value, metric.type, metric.id)
                  return (
                    <td key={metric.id} className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      {formattedValue}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="sticky left-0 bottom-0 z-20 w-12 bg-gray-200 dark:bg-black border-t-[3px] border-gray-400 dark:border-gray-400 px-6 py-3"></td>
              <td className="sticky left-12 bottom-0 z-20 w-24 bg-gray-200 dark:bg-black border-t-[3px] border-gray-400 dark:border-gray-400 px-6 py-3"></td>
              <td className="sticky left-[144px] bottom-0 z-20 bg-gray-200 dark:bg-black border-t-[3px] border-gray-400 dark:border-gray-400 shadow-[inset_-2px_0_0_0_rgba(100,116,139,0.25)] dark:shadow-[inset_-2px_0_0_0_rgba(148,163,184,0.3)] px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap" style={{ width: nameColWidth, minWidth: nameColWidth, maxWidth: nameColWidth }}>
                {adSets.length} {adSets.length === 1 ? 'CONJUNTO' : 'CONJUNTOS'}
              </td>
              <td className="sticky bottom-0 z-10 bg-gray-200 dark:bg-black border-t-[3px] border-gray-400 dark:border-gray-400 px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                {totalBudget > 0 ? formatCurrency(totalBudget) : '-'}
              </td>
              {showMetrics && visibleMetrics.map((metric, index) => (
                <td key={metric.id} className="sticky bottom-0 z-10 bg-gray-200 dark:bg-black border-t-[3px] border-gray-400 dark:border-gray-400 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                  {metricTotals[index] === null ? '-' : formatMetricValue(metricTotals[index], metric.type, metric.id)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
