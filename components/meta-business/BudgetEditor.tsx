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
}

export default function BudgetEditor({
  id,
  currentBudget,
  budgetType,
  onUpdate,
  disabled = false,
  currency = 'BRL',
  minValue = 1,
  maxValue = 1000000
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
      <div className="flex items-center space-x-2 min-w-[160px] bg-white border border-blue-300 rounded-lg shadow-sm">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={budget}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 text-sm border-0 rounded-lg focus:outline-none focus:ring-0"
            placeholder="0,00"
            disabled={isUpdating}
          />
        </div>
        
        <div className="flex items-center space-x-1 pr-2">
          <span className="text-xs text-gray-500 font-medium">
            {budgetType === 'daily' ? 'Diário' : 'Total'}
          </span>
          
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
      </div>
    )
  }

  // Determinar se pode editar
  const canEdit = !disabled

  // Determinar mensagem de tooltip
  const getTooltipMessage = () => {
    if (disabled) return 'Orçamento não pode ser editado'
    return `Clique para editar orçamento ${budgetType === 'daily' ? 'diário' : 'total'}`
  }

  return (
    <div 
      className={`flex items-center space-x-2 min-w-[140px] rounded px-3 py-2 transition-all duration-200 ${
        canEdit 
          ? 'cursor-pointer group hover:bg-blue-50 hover:border-blue-200 border border-transparent hover:shadow-sm' 
          : 'cursor-not-allowed opacity-60'
      }`}
      onClick={handleStartEdit}
      title={getTooltipMessage()}
    >
      <div className="flex items-center space-x-2 flex-1">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {formatCurrency(currentBudget)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {budgetType === 'daily' ? 'Diário' : 'Total'}
        </span>
        {canEdit && (
          <div className="w-1 h-1 bg-gray-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
        )}
      </div>
      
      {canEdit && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-4 h-4 text-gray-400 hover:text-blue-600">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L5.707 13.5a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5v-3.207a.5.5 0 0 1 .146-.353L12.146.146zM1.5 10.5V13h2.5L12.5 4.5 10 2 1.5 10.5z"/>
            </svg>
          </div>
        </div>
      )}
      
    </div>
  )
}
