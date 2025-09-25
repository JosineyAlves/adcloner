'use client'

import { useState, useRef, useEffect } from 'react'
import { DollarSign, Check, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface BudgetEditorProps {
  id: string
  currentBudget: number
  budgetType: 'daily' | 'lifetime'
  onUpdate: (id: string, budget: number, budgetType: 'daily' | 'lifetime') => Promise<void>
  disabled?: boolean
  currency?: string
  minValue?: number
  maxValue?: number
  isCBO?: boolean // Campaign Budget Optimization
  level?: 'campaign' | 'adset' // Nível do orçamento
}

export default function BudgetEditor({
  id,
  currentBudget,
  budgetType,
  onUpdate,
  disabled = false,
  currency = 'BRL',
  minValue = 1,
  maxValue = 1000000,
  isCBO = false,
  level = 'adset'
}: BudgetEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [budget, setBudget] = useState(currentBudget.toString())
  const [isUpdating, setIsUpdating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Formatar valor para exibição
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(value / 100) // Converter de centavos para reais
  }

  // Converter valor de entrada para centavos
  const parseToCents = (value: string) => {
    const cleanValue = value.replace(/[^\d,.-]/g, '')
    const numericValue = parseFloat(cleanValue.replace(',', '.'))
    return Math.round(numericValue * 100) // Converter para centavos
  }

  // Converter centavos para valor de entrada
  const parseFromCents = (cents: number) => {
    return (cents / 100).toFixed(2).replace('.', ',')
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    setBudget(parseFromCents(currentBudget))
  }, [currentBudget])

  const handleStartEdit = () => {
    if (disabled) return
    
    // Verificar se pode editar baseado no tipo de orçamento
    if (level === 'campaign' && !isCBO) {
      toast.error('Esta campanha não usa CBO. Edite o orçamento no nível do Conjunto de Anúncios.')
      return
    }
    
    if (level === 'adset' && isCBO) {
      toast.error('Esta campanha usa CBO. Edite o orçamento no nível da Campanha.')
      return
    }
    
    setIsEditing(true)
    setBudget(parseFromCents(currentBudget))
  }

  const handleCancel = () => {
    setIsEditing(false)
    setBudget(parseFromCents(currentBudget))
  }

  const handleSave = async () => {
    if (disabled || isUpdating) return

    const numericBudget = parseToCents(budget)
    
    // Validações
    if (isNaN(numericBudget) || numericBudget < minValue) {
      toast.error(`Valor mínimo: ${formatCurrency(minValue)}`)
      return
    }

    if (numericBudget > maxValue) {
      toast.error(`Valor máximo: ${formatCurrency(maxValue)}`)
      return
    }

    if (numericBudget === currentBudget) {
      setIsEditing(false)
      return
    }

    setIsUpdating(true)
    try {
      await onUpdate(id, numericBudget, budgetType)
      toast.success(`Orçamento ${budgetType === 'daily' ? 'diário' : 'total'} atualizado para ${formatCurrency(numericBudget)}`)
      setIsEditing(false)
    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error)
      toast.error('Erro ao atualizar orçamento. Tente novamente.')
      setBudget(parseFromCents(currentBudget))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    
    // Permitir apenas números, vírgula e ponto
    value = value.replace(/[^\d,.-]/g, '')
    
    // Garantir apenas uma vírgula ou ponto
    const hasComma = value.includes(',')
    const hasDot = value.includes('.')
    
    if (hasComma && hasDot) {
      value = value.replace(/[.,]/g, (match, offset) => {
        return offset === value.lastIndexOf(match) ? match : ''
      })
    }
    
    setBudget(value)
  }

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2 min-w-[120px]">
        <div className="relative flex-1">
          <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            ref={inputRef}
            type="text"
            value={budget}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="w-full pl-8 pr-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0,00"
            disabled={isUpdating}
          />
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={handleSave}
            disabled={isUpdating}
            className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Salvar"
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
          
          <button
            onClick={handleCancel}
            disabled={isUpdating}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Cancelar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // Determinar se pode editar
  const canEdit = !disabled && (
    (level === 'campaign' && isCBO) || 
    (level === 'adset' && !isCBO)
  )

  // Determinar mensagem de tooltip
  const getTooltipMessage = () => {
    if (disabled) return 'Orçamento não pode ser editado'
    if (level === 'campaign' && !isCBO) return 'Esta campanha não usa CBO. Edite o orçamento no nível do Conjunto de Anúncios.'
    if (level === 'adset' && isCBO) return 'Esta campanha usa CBO. Edite o orçamento no nível da Campanha.'
    return `Clique para editar orçamento ${budgetType === 'daily' ? 'diário' : 'total'}`
  }

  return (
    <div 
      className={`flex items-center space-x-2 min-w-[120px] rounded px-2 py-1 transition-colors ${
        canEdit 
          ? 'cursor-pointer group hover:bg-gray-50' 
          : 'cursor-not-allowed opacity-60'
      }`}
      onClick={handleStartEdit}
      title={getTooltipMessage()}
    >
      <DollarSign className="text-gray-400 w-4 h-4" />
      <span className="text-sm font-medium text-gray-900 dark:text-white">
        {formatCurrency(currentBudget)}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {budgetType === 'daily' ? '/dia' : '/total'}
      </span>
      
      {canEdit && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
      )}
      
      {!canEdit && (
        <div className="text-xs text-gray-400">
          {level === 'campaign' && !isCBO ? 'ABO' : level === 'adset' && isCBO ? 'CBO' : ''}
        </div>
      )}
    </div>
  )
}
