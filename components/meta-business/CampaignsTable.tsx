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
import toast from 'react-hot-toast'

interface CampaignsTableProps {
  campaigns: MetaCampaign[]
  selectedCampaigns: Set<string>
  onSelectionChange: (selected: Set<string>) => void
  onStatusToggle: (type: 'campaigns' | 'adsets' | 'ads', id: string, currentStatus: string) => void
  onBudgetUpdate: (type: 'campaigns' | 'adsets', id: string, budget: number, budgetType: 'daily' | 'lifetime') => void
  onBulkStatusUpdate: (type: 'campaigns' | 'adsets' | 'ads', status: string) => void
  metrics?: MetricConfig[]
  showMetrics?: boolean
}

export default function CampaignsTable({
  campaigns,
  selectedCampaigns,
  onSelectionChange,
  onStatusToggle,
  onBudgetUpdate,
  onBulkStatusUpdate,
  metrics = [],
  showMetrics = false
}: CampaignsTableProps) {

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
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const formatMetricValue = (value: any, type: 'number' | 'currency' | 'percentage') => {
    if (value === null || value === undefined) return '-'
    
    const numValue = typeof value === 'number' ? value : parseFloat(value)
    
    if (isNaN(numValue)) return '-'
    
    switch (type) {
      case 'currency':
        return formatCurrency(numValue)
      case 'percentage':
        return formatPercentage(numValue)
      default:
        return formatNumber(numValue)
    }
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Nenhuma campanha encontrada
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Não há campanhas disponíveis para o período selecionado.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Ações em lote */}
      {selectedCampaigns.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedCampaigns.size} campanha(s) selecionada(s)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onBulkStatusUpdate('campaigns', 'ACTIVE')}
                className="btn-secondary text-sm flex items-center space-x-1"
              >
                <Play className="w-4 h-4" />
                <span>Ativar</span>
              </button>
              <button
                onClick={() => onBulkStatusUpdate('campaigns', 'PAUSED')}
                className="btn-secondary text-sm flex items-center space-x-1"
              >
                <Pause className="w-4 h-4" />
                <span>Pausar</span>
              </button>
              <button
                onClick={() => onBulkStatusUpdate('campaigns', 'ARCHIVED')}
                className="btn-secondary text-sm flex items-center space-x-1"
              >
                <Archive className="w-4 h-4" />
                <span>Arquivar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedCampaigns.size === campaigns.length && campaigns.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Campanha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Orçamento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Gasto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Impressões
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cliques
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                CPC
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                CTR
              </th>
              {showMetrics && metrics.filter(m => m.visible).map((metric) => (
                <th key={metric.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {metric.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedCampaigns.has(campaign.id)}
                    onChange={() => handleSelectCampaign(campaign.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <StatusToggle
                    id={campaign.id}
                    status={campaign.status}
                    effectiveStatus={campaign.effective_status}
                    onToggle={handleStatusToggle}
                    disabled={campaign.status === 'ARCHIVED'}
                    size="md"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {campaign.name}
                  </div>
                </td>
                <td className="px-6 py-4">
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
                            budgetType
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
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {formatCurrency(campaign.spend)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {formatNumber(campaign.impressions)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {formatNumber(campaign.clicks)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {formatCurrency(campaign.cpc)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {formatPercentage(campaign.ctr)}
                </td>
                {showMetrics && metrics.filter(m => m.visible).map((metric) => {
                  const value = (campaign as any)[metric.id]
                  const formattedValue = formatMetricValue(value, metric.type)
                  return (
                    <td key={metric.id} className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {formattedValue}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
