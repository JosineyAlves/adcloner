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
  Info,
  BarChart3
} from 'lucide-react'
import { MetaCampaign } from '@/lib/types'
import { MetricConfig } from '@/lib/metrics-config'
import StatusToggle from './StatusToggle'
import BudgetEditor from './BudgetEditor'
import NameEditor from './NameEditor'
import ColumnResizeHandle from './ColumnResizeHandle'
import { useTableSort } from '@/hooks/useTableSort'
import { useResizableColumns } from '@/hooks/useResizableColumns'
import toast from 'react-hot-toast'

interface CampaignsTableProps {
  campaigns: MetaCampaign[]
  selectedCampaigns: Set<string>
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

export default function CampaignsTable({
  campaigns,
  selectedCampaigns,
  onSelectionChange,
  onStatusToggle,
  onBudgetUpdate,
  onNameUpdate,
  onBulkStatusUpdate,
  metrics = [],
  showMetrics = false
}: CampaignsTableProps) {
  
  // Debug: verificar métricas recebidas
  console.log('📊 CampaignsTable - Métricas recebidas:', metrics.filter(m => m.visible).map(m => m.label))
  console.log('📊 CampaignsTable - showMetrics:', showMetrics)

  const handleSelectAll = () => {
    if (selectedCampaigns.size === campaigns.length) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(campaigns.map(c => c.id)))
    }
  }

  const handleSelectCampaign = (campaignId: string) => {
    const newSelection = new Set(selectedCampaigns)
    if (newSelection.has(campaignId)) {
      newSelection.delete(campaignId)
    } else {
      newSelection.add(campaignId)
    }
    onSelectionChange(newSelection)
  }

  const handleStatusToggle = async (campaignId: string, currentStatus: string) => {
    await onStatusToggle('campaigns', campaignId, currentStatus)
  }



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

  // Linha de totais no rodapé (estilo "N CAMPAIGNS" + somas por coluna, inspirado no layout de
  // trackers como a UTMify). Colunas do tipo 'number'/'currency' são somadas; 'percentage' usa a
  // média simples entre os valores disponíveis — somar percentuais não faz sentido (ex.: CTR).
  const visibleMetrics = metrics.filter(m => m.visible)
  const totalBudget = campaigns.reduce(
    (sum, c) => sum + (c.daily_budget || c.lifetime_budget || 0),
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
      for (const row of campaigns) {
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

    const values = campaigns
      .map((c) => (c as any)[metric.id])
      .map((v) => (typeof v === 'number' ? v : parseFloat(v)))
      .filter((v) => !isNaN(v))
    if (values.length === 0) return null
    const sum = values.reduce((s, v) => s + v, 0)
    return metric.type === 'percentage' ? sum / values.length : sum
  })

  // Ordenação por coluna (clique no cabeçalho) — ver hooks/useTableSort.ts. "budget" é uma chave
  // virtual (não existe como campo único no objeto) porque o orçamento efetivo é
  // daily_budget || lifetime_budget, igual ao que já é exibido/somado acima.
  const { sortConfig, handleSort, sortedRows: sortedCampaigns } = useTableSort<MetaCampaign>(
    campaigns,
    'name',
    (row, key) => (key === 'budget' ? row.daily_budget || row.lifetime_budget || 0 : (row as any)[key])
  )

  // Largura ajustável (arrastar + duplo-clique pra ajustar ao conteúdo) das colunas Nome,
  // Orçamento e de cada métrica visível — ver hooks/useResizableColumns.ts.
  const { getWidth, startResize, autoFit, resizingId } = useResizableColumns('campaigns')
  const nameColWidth = getWidth('name', 240)
  const budgetColWidth = getWidth('budget', 140)
  const handleAutoFitName = () => autoFit('name', [...campaigns.map(c => c.name), 'Campanha'])
  const handleAutoFitBudget = () => autoFit('budget', [
    ...campaigns.map(c => formatCurrency(c.daily_budget || c.lifetime_budget || 0)),
    'Orçamento'
  ])

          if (campaigns.length === 0) {
            return (
              <div className="space-y-4">
                {/* Cabeçalho da tabela mesmo sem dados */}
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
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
                          Campanha
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
                                  ...campaigns.map(c => formatMetricValue((c as any)[metric.id], metric.type, metric.id)),
                                  metric.label
                                ])}
                                isResizing={resizingId === metric.id}
                              />
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={9 + (showMetrics ? metrics.filter(m => m.visible).length : 0)} className="px-6 py-12 text-center">
                          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Nenhuma campanha encontrada
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            Não há campanhas disponíveis para o período selecionado.
                          </p>
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
          de totais no rodapé possa ficar fixa (sticky) enquanto as linhas de campanha passam por
          baixo dela, sem precisar rolar a página inteira até o fim para ver os totais. */}
      {/* Área de rolagem única (horizontal + vertical) — a tentativa de separar isso em dois
          contêineres não resolveu o leve efeito visual de "colunas se empurrando" no scroll
          lateral (é um comportamento residual do próprio navegador ao combinar cabeçalho fixo +
          colunas fixas, sem impacto funcional), então voltamos à versão mais simples: flex-1
          min-h-0 continua fazendo a tabela ocupar exatamente a primeira dobra disponível. */}
      <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
        <table className="min-w-full">
          <thead className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-700">
            <tr>
              {/* Checkbox/Status/Campanha ficam fixos (sticky left) durante a rolagem horizontal
                  pelas colunas de métrica — cada um com largura fixa (w-12/w-24 + a largura
                  ajustável do Nome) pra que os offsets `left-*` das colunas seguintes sejam
                  previsíveis. z-20 no cabeçalho e z-10 no corpo/z-20 no rodapé evitam que
                  conteúdo role por cima na direção errada. O próprio <thead> agora é `sticky
                  top-0` também, pra continuar visível durante a rolagem vertical (antes só a
                  linha de totais no rodapé ficava fixa). */}
              <th className="sticky left-0 z-20 w-12 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left align-bottom">
                <input
                  type="checkbox"
                  checked={selectedCampaigns.size === campaigns.length && campaigns.length > 0}
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
                Campanha
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
                        ...campaigns.map(c => formatMetricValue((c as any)[metric.id], metric.type, metric.id)),
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
            {sortedCampaigns.map((campaign) => (
              <tr key={campaign.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="sticky left-0 z-10 w-12 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectedCampaigns.has(campaign.id)}
                    onChange={() => handleSelectCampaign(campaign.id)}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                </td>
                <td className="sticky left-12 z-10 w-24 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 px-6 py-3">
                  <StatusToggle
                    id={campaign.id}
                    status={campaign.status}
                    effectiveStatus={campaign.effective_status}
                    onToggle={handleStatusToggle}
                    disabled={campaign.status === 'ARCHIVED'}
                    size="md"
                  />
                </td>
                <td className="sticky left-[144px] z-10 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 shadow-[inset_-2px_0_0_0_rgba(100,116,139,0.25)] dark:shadow-[inset_-2px_0_0_0_rgba(148,163,184,0.3)] px-6 py-3" style={{ width: nameColWidth, minWidth: nameColWidth, maxWidth: nameColWidth }}>
                  <NameEditor
                    id={campaign.id}
                    currentName={campaign.name}
                    onUpdate={async (id, name) => {
                      const response = await fetch(`/api/meta-business/campaigns/${id}/name`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name,
                          // Deixa o servidor resolver o token da conexão dona dessa conta em
                          // vez de só o cookie único — ver lib/meta-connections.ts.
                          accountId: campaign.account_id
                        })
                      })

                      const result = await response.json()

                      if (result.success) {
                        onNameUpdate('campaigns', id, name)
                      } else {
                        const error = new Error(result.error || 'Erro ao atualizar nome')
                        ;(error as any).error = result.error
                        throw error
                      }
                    }}
                  />
                </td>
                <td className="px-6 py-3" style={{ width: budgetColWidth, minWidth: budgetColWidth, maxWidth: budgetColWidth }}>
                  <BudgetEditor
                    id={campaign.id}
                    currentBudget={campaign.daily_budget || campaign.lifetime_budget || 0}
                    budgetType={campaign.budget_type}
                    onUpdate={async (id, budget, budgetType) => {
                      try {
                        const response = await fetch(`/api/meta-business/campaigns/${id}/budget`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            budget: budget, // Já está em reais
                            budgetType,
                            // Deixa o servidor resolver o token da conexão dona dessa conta em
                            // vez de só o cookie único — ver lib/meta-connections.ts.
                            accountId: campaign.account_id
                          })
                        })

                        const result = await response.json()

                        if (result.success) {
                          onBudgetUpdate('campaigns', id, budget, budgetType)
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
                    minValue={0.01} // R$ 0,01 (valor mínimo)
                    maxValue={10000000} // R$ 100.000,00 em centavos
                    isCBO={campaign.advantage_campaign_budget}
                    level="campaign"
                  />
                </td>
                {showMetrics && metrics.filter(m => m.visible).map((metric) => {
                  const value = (campaign as any)[metric.id]
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
            {/* sticky aplicado em cada <td> (não no <tr>/<tfoot>) — é a forma mais confiável entre
                navegadores de fixar uma linha de rodapé de tabela dentro de um contêiner com
                rolagem própria. */}
            <tr>
              {/* z-20 aqui (em vez do z-10 usado pelas demais células do rodapé) porque estas 3
                  também são sticky-left — precisam ficar acima das linhas do corpo (z-10) que
                  passam por baixo tanto na rolagem vertical quanto na horizontal. */}
              <td className="sticky left-0 bottom-0 z-20 w-12 bg-gray-200 dark:bg-black border-t-[3px] border-gray-400 dark:border-gray-400 px-6 py-3"></td>
              <td className="sticky left-12 bottom-0 z-20 w-24 bg-gray-200 dark:bg-black border-t-[3px] border-gray-400 dark:border-gray-400 px-6 py-3"></td>
              <td className="sticky left-[144px] bottom-0 z-20 bg-gray-200 dark:bg-black border-t-[3px] border-gray-400 dark:border-gray-400 shadow-[inset_-2px_0_0_0_rgba(100,116,139,0.25)] dark:shadow-[inset_-2px_0_0_0_rgba(148,163,184,0.3)] px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap" style={{ width: nameColWidth, minWidth: nameColWidth, maxWidth: nameColWidth }}>
                {campaigns.length} {campaigns.length === 1 ? 'CAMPANHA' : 'CAMPANHAS'}
              </td>
              <td className="sticky bottom-0 z-10 bg-gray-200 dark:bg-black border-t-[3px] border-gray-400 dark:border-gray-400 px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap" style={{ width: budgetColWidth, minWidth: budgetColWidth, maxWidth: budgetColWidth }}>
                {totalBudget > 0 ? formatCurrency(totalBudget) : '-'}
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
