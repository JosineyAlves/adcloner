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
import MetricsColumn from './MetricsColumn'
import toast from 'react-hot-toast'

interface AdSetsTableProps {
  adSets: MetaAdSet[]
  selectedAdSets: Set<string>
  onSelectionChange: (selected: Set<string>) => void
  onStatusToggle: (type: 'campaigns' | 'adsets' | 'ads', id: string, currentStatus: string) => void
  onBudgetUpdate: (type: 'campaigns' | 'adsets', id: string, budget: number, budgetType: 'daily' | 'lifetime') => void
  onBulkStatusUpdate: (type: 'campaigns' | 'adsets' | 'ads', status: string) => void
  metrics?: MetricConfig[]
  showMetrics?: boolean
}

export default function AdSetsTable({
  adSets,
  selectedAdSets,
  onSelectionChange,
  onStatusToggle,
  onBudgetUpdate,
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

    // Frequência: arredonda pra 2 casas decimais (ex.: 1.185 -> "1.19"), igual ao Gerenciador de
    // Anúncios nativo — o formatNumber genérico abaixo deixava até 3 casas por padrão.
    if (metricId === 'frequency') return numValue.toFixed(2)

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
  const metricTotals = visibleMetrics.map((metric) => {
    const values = adSets
      .map((a) => (a as any)[metric.id])
      .map((v) => (typeof v === 'number' ? v : parseFloat(v)))
      .filter((v) => !isNaN(v))
    if (values.length === 0) return null
    const sum = values.reduce((s, v) => s + v, 0)
    return metric.type === 'percentage' ? sum / values.length : sum
  })

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
          <table className="w-full">
            <thead className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="sticky left-0 z-20 w-12 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    disabled
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="sticky left-12 z-20 w-24 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="sticky left-[144px] z-20 w-[240px] bg-gray-50 dark:bg-gray-700 border-r-2 border-gray-300 dark:border-gray-600 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  Conjunto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  Orçamento
                </th>
                {showMetrics && metrics.filter(m => m.visible).map((metric) => (
                  <th key={metric.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {metric.label}
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
    <div className="space-y-4">

      {/* Tabela — altura limitada com rolagem própria (max-h + overflow-y-auto) para que a linha
          de totais no rodapé possa ficar fixa (sticky) enquanto as linhas passam por baixo dela. */}
      <div className="overflow-x-auto overflow-y-auto max-h-[65vh]">
        <table className="w-full">
          <thead className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="sticky left-0 z-20 w-12 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedAdSets.size === adSets.length && adSets.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="sticky left-12 z-20 w-24 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
              <th className="sticky left-[144px] z-20 w-[240px] bg-gray-50 dark:bg-gray-700 border-r-2 border-gray-300 dark:border-gray-600 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Conjunto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Orçamento
              </th>
              {showMetrics && metrics.filter(m => m.visible).map((metric) => (
                <th key={metric.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  {metric.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {adSets.map((adSet) => (
              <tr key={adSet.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="sticky left-0 z-10 w-12 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedAdSets.has(adSet.id)}
                    onChange={() => handleSelectAdSet(adSet.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="sticky left-12 z-10 w-24 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 px-6 py-4">
                  <StatusToggle
                    id={adSet.id}
                    status={adSet.status}
                    effectiveStatus={adSet.effective_status}
                    onToggle={handleStatusToggle}
                    disabled={adSet.status === 'ARCHIVED'}
                    size="md"
                  />
                </td>
                <td className="sticky left-[144px] z-10 w-[240px] bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 border-r-2 border-gray-200 dark:border-gray-600 px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={adSet.name}>
                    {adSet.name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {adSet.campaign_advantage_budget ? (
                    // Campanha-pai usa CBO (Advantage Campaign Budget) — o orçamento vive na
                    // Campaign, o Ad Set não tem orçamento próprio pra editar (mesmo padrão de
                    // "Definido no conjunto" usado em AdsTable.tsx para anúncios).
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">-</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Definido na campanha
                      </div>
                    </div>
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
                    <td key={metric.id} className="px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      {formattedValue}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="sticky left-0 bottom-0 z-20 w-12 bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-200 dark:border-gray-600 px-6 py-3"></td>
              <td className="sticky left-12 bottom-0 z-20 w-24 bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-200 dark:border-gray-600 px-6 py-3"></td>
              <td className="sticky left-[144px] bottom-0 z-20 w-[240px] bg-gray-50 dark:bg-gray-700 border-t-2 border-r-2 border-gray-200 dark:border-gray-600 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                {adSets.length} {adSets.length === 1 ? 'CONJUNTO' : 'CONJUNTOS'}
              </td>
              <td className="sticky bottom-0 z-10 bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-200 dark:border-gray-600 px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                {totalBudget > 0 ? formatCurrency(totalBudget) : '-'}
              </td>
              {showMetrics && visibleMetrics.map((metric, index) => (
                <td key={metric.id} className="sticky bottom-0 z-10 bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-200 dark:border-gray-600 px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
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
