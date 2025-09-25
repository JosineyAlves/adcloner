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
import StatusToggle from './StatusToggle'
import toast from 'react-hot-toast'

interface AdSetsTableProps {
  adSets: MetaAdSet[]
  selectedAdSets: Set<string>
  onSelectionChange: (selected: Set<string>) => void
  onStatusToggle: (type: 'campaigns' | 'adsets' | 'ads', id: string, currentStatus: string) => void
  onBudgetUpdate: (type: 'campaigns' | 'adsets', id: string, budget: number, budgetType: 'daily' | 'lifetime') => void
  onBulkStatusUpdate: (type: 'campaigns' | 'adsets' | 'ads', status: string) => void
}

export default function AdSetsTable({
  adSets,
  selectedAdSets,
  onSelectionChange,
  onStatusToggle,
  onBudgetUpdate,
  onBulkStatusUpdate
}: AdSetsTableProps) {
  const [editingBudget, setEditingBudget] = useState<string | null>(null)
  const [budgetValue, setBudgetValue] = useState<string>('')
  const [budgetType, setBudgetType] = useState<'daily' | 'lifetime'>('daily')

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

  const handleBudgetEdit = (adSet: MetaAdSet) => {
    setEditingBudget(adSet.id)
    setBudgetValue(adSet.daily_budget ? adSet.daily_budget.toString() : adSet.lifetime_budget?.toString() || '')
    setBudgetType(adSet.budget_type)
  }

  const handleBudgetSave = () => {
    if (!editingBudget) return
    
    const budget = parseFloat(budgetValue)
    if (isNaN(budget) || budget < 0.01) {
      toast.error('Orçamento deve ser pelo menos R$ 0,01')
      return
    }

    onBudgetUpdate('adsets', editingBudget, budget, budgetType)
    setEditingBudget(null)
    setBudgetValue('')
  }

  const handleBudgetCancel = () => {
    setEditingBudget(null)
    setBudgetValue('')
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
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Nenhum conjunto encontrado
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Não há conjuntos de anúncios disponíveis para o período selecionado.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Ações em lote */}
      {selectedAdSets.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedAdSets.size} conjunto(s) selecionado(s)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onBulkStatusUpdate('adsets', 'ACTIVE')}
                className="btn-secondary text-sm flex items-center space-x-1"
              >
                <Play className="w-4 h-4" />
                <span>Ativar</span>
              </button>
              <button
                onClick={() => onBulkStatusUpdate('adsets', 'PAUSED')}
                className="btn-secondary text-sm flex items-center space-x-1"
              >
                <Pause className="w-4 h-4" />
                <span>Pausar</span>
              </button>
              <button
                onClick={() => onBulkStatusUpdate('adsets', 'ARCHIVED')}
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
                  checked={selectedAdSets.size === adSets.length && adSets.length > 0}
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
                Campanha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Orçamento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Lance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Targeting
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Gasto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                CPC
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                CTR
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {adSets.map((adSet) => (
              <tr key={adSet.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedAdSets.has(adSet.id)}
                    onChange={() => handleSelectAdSet(adSet.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <StatusToggle
                    id={adSet.id}
                    status={adSet.status}
                    effectiveStatus={adSet.effective_status}
                    onToggle={handleStatusToggle}
                    disabled={adSet.status === 'ARCHIVED'}
                    size="md"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {adSet.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {adSet.account_name}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {adSet.campaign_name}
                </td>
                <td className="px-6 py-4">
                  {editingBudget === adSet.id ? (
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
                        {adSet.daily_budget ? formatCurrency(adSet.daily_budget) : formatCurrency(adSet.lifetime_budget || 0)}
                        <span className="text-xs text-gray-500 ml-1">
                          ({adSet.budget_type === 'daily' ? 'diário' : 'vida útil'})
                        </span>
                      </span>
                      <button
                        onClick={() => handleBudgetEdit(adSet)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar orçamento"
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {adSet.bid_amount ? formatCurrency(adSet.bid_amount) : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                  {formatTargeting(adSet.targeting)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {formatCurrency(adSet.spend)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {formatCurrency(adSet.cpc)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {formatPercentage(adSet.ctr)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
