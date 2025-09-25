'use client'

import { useState } from 'react'
import { Edit2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface BudgetEditorProps {
  id: string
  currentBudget: number
  onBudgetChange?: (id: string, newBudget: number) => void
  disabled?: boolean
  currency?: string
}

export default function BudgetEditor({ 
  id, 
  currentBudget, 
  onBudgetChange,
  disabled = false,
  currency = 'R$'
}: BudgetEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [budget, setBudget] = useState(currentBudget)
  const [isLoading, setIsLoading] = useState(false)

  const formatBudget = (value: number) => {
    return `${currency} ${value.toFixed(2).replace('.', ',')}`
  }

  const handleEdit = () => {
    if (disabled) return
    setIsEditing(true)
    setBudget(currentBudget)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setBudget(currentBudget)
  }

  const handleSave = async () => {
    if (budget <= 0) {
      toast.error('Orçamento deve ser maior que zero')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/adsets/${id}/budget`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ dailyBudget: budget })
      })

      const data = await response.json()

      if (data.success) {
        setIsEditing(false)
        onBudgetChange?.(id, budget)
        toast.success(data.message)
      } else {
        toast.error(data.message || 'Erro ao atualizar orçamento')
      }
    } catch (error) {
      console.error('Error updating budget:', error)
      toast.error('Erro ao atualizar orçamento')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-1">{currency}</span>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
            onKeyDown={handleKeyPress}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
            step="0.01"
            min="0"
            autoFocus
            disabled={isLoading}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>
        {isLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-900 dark:text-white">
        {formatBudget(currentBudget)}
      </span>
      <span className="text-xs text-gray-500">Diário</span>
      {!disabled && (
        <button
          onClick={handleEdit}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
