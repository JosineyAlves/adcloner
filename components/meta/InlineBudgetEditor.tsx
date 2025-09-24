'use client'

import { useState, useRef, useEffect } from 'react'
import { Edit2, Check, X } from 'lucide-react'

interface InlineBudgetEditorProps {
  value: number
  onSave: (newValue: number) => void
  onCancel?: () => void
  disabled?: boolean
  placeholder?: string
}

export default function InlineBudgetEditor({
  value,
  onSave,
  onCancel,
  disabled = false,
  placeholder = "0,00"
}: InlineBudgetEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value.toString())
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleEdit = () => {
    if (disabled) return
    setEditValue(value.toString())
    setIsEditing(true)
    setError(null)
  }

  const handleSave = () => {
    const numericValue = parseFloat(editValue.replace(',', '.'))
    
    if (isNaN(numericValue) || numericValue < 0) {
      setError('Valor inválido')
      return
    }

    if (numericValue === value) {
      setIsEditing(false)
      return
    }

    onSave(numericValue)
    setIsEditing(false)
    setError(null)
  }

  const handleCancel = () => {
    setEditValue(value.toString())
    setIsEditing(false)
    setError(null)
    onCancel?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const formatCurrency = (val: number) => {
    return `R$ ${val.toFixed(2).replace('.', ',')}`
  }

  if (isEditing) {
    return (
      <div className="flex items-center space-x-1">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {error && (
            <div className="absolute top-full left-0 mt-1 text-xs text-red-500 bg-white border border-red-200 rounded px-2 py-1 shadow-lg z-10">
              {error}
            </div>
          )}
        </div>
        <button
          onClick={handleSave}
          className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
          title="Salvar"
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
          title="Cancelar"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-1 group">
      <span className="text-sm text-gray-900 dark:text-white">
        {formatCurrency(value)}
      </span>
      {!disabled && (
        <button
          onClick={handleEdit}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"
          title="Editar orçamento"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
