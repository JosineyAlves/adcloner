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
import toast from 'react-hot-toast'

interface CampaignsTableProps {
  campaigns: MetaCampaign[]
  selectedCampaigns: Set<string>
  onSelectionChange: (selected: Set<string>) => void
  onStatusToggle: (type: 'campaigns' | 'adsets' | 'ads', id: string, currentStatus: string) => void
  onBudgetUpdate: (type: 'campaigns' | 'adsets', id: string, budget: number, budgetType: 'daily' | 'lifetime') => void
  onBulkStatusUpdate: (type: 'campaigns' | 'adsets' | 'ads', status: string) => void
}

export default function CampaignsTable({
  campaigns,
  selectedCampaigns,
  onSelectionChange,
  onStatusToggle,
  onBudgetUpdate,
  onBulkStatusUpdate
}: CampaignsTableProps) {
  const [editingBudget, setEditingBudget] = useState<string | null>(null)
  const [budgetValue, setBudgetValue] = useState<string>('')
  const [budgetType, setBudgetType] = useState<'daily' | 'lifetime'>('daily')

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

  const handleStatusToggle = (campaignId: string, currentStatus: string) => {
    onStatusToggle('campaigns', campaignId, currentStatus)
  }

  const handleBudgetEdit = (campaign: MetaCampaign) => {
    if (!campaign.advantage_campaign_budget) {
      toast.error('Esta campanha não possui Advantage Campaign Budget ativo. Edite o orçamento no nível do Conjunto de Anúncios.')
      return
    }
    
    setEditingBudget(campaign.id)
    setBudgetValue(campaign.daily_budget ? campaign.daily_budget.toString() : campaign.lifetime_budget?.toString() || '')
    setBudgetType(campaign.budget_type)
  }

  const handleBudgetSave = () => {
    if (!editingBudget) return
    
    const budget = parseFloat(budgetValue)
    if (isNaN(budget) || budget < 0.01) {
      toast.error('Orçamento deve ser pelo menos R$ 0,01')
      return
    }

    onBudgetUpdate('campaigns', editingBudget, budget, budgetType)
    setEditingBudget(null)
    setBudgetValue('')
  }

  const handleBudgetCancel = () => {
    setEditingBudget(null)
    setBudgetValue('')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Play className="w-4 h-4 text-green-600" />
      case 'PAUSED':
        return <Pause className="w-4 h-4 text-yellow-600" />
      case 'ARCHIVED':
        return <Archive className="w-4 h-4 text-gray-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getEffectiveStatusColor = (effectiveStatus: string) => {
    switch (effectiveStatus) {
      case 'ACTIVE':
        return 'text-green-600'
      case 'PAUSED':
        return 'text-yellow-600'
      case 'ARCHIVED':
        return 'text-gray-600'
      case 'CAMPAIGN_PAUSED':
        return 'text-orange-600'
      case 'CAMPAIGN_ARCHIVED':
        return 'text-red-600'
      default:
        return 'text-gray-400'
    }
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
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Objetivo
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ações
              </th>
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
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {getStatusIcon(campaign.status)}
                      <span className="ml-1">{campaign.status}</span>
                    </span>
                    {campaign.status !== campaign.effective_status && (
                      <span className={`text-xs ${getEffectiveStatusColor(campaign.effective_status)}`} title="Status efetivo">
                        ({campaign.effective_status})
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {campaign.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {campaign.account_name}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {campaign.objective}
                </td>
                <td className="px-6 py-4">
                  {editingBudget === campaign.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={budgetValue}
                        onChange={(e) => setBudgetValue(e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        step="0.01"
                        min="0.01"
                      />
                      <select
                        value={budgetType}
                        onChange={(e) => setBudgetType(e.target.value as 'daily' | 'lifetime')}
                        className="text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="daily">Diário</option>
                        <option value="lifetime">Vida útil</option>
                      </select>
                      <button
                        onClick={handleBudgetSave}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleBudgetCancel}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {campaign.daily_budget ? formatCurrency(campaign.daily_budget) : formatCurrency(campaign.lifetime_budget || 0)}
                        <span className="text-xs text-gray-500 ml-1">
                          ({campaign.budget_type === 'daily' ? 'diário' : 'vida útil'})
                        </span>
                      </span>
                      {campaign.advantage_campaign_budget ? (
                        <button
                          onClick={() => handleBudgetEdit(campaign)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar orçamento"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400" title="Advantage Campaign Budget não ativo">
                          <Info className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  )}
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
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleStatusToggle(campaign.id, campaign.status)}
                      className={`p-1 rounded ${
                        campaign.status === 'ACTIVE' 
                          ? 'text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900' 
                          : 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900'
                      }`}
                      title={campaign.status === 'ACTIVE' ? 'Pausar' : 'Ativar'}
                    >
                      {campaign.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
