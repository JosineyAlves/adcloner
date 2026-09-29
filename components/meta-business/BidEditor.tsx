'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface BidEditorProps {
  id: string
  currentBid?: number // Já no valor bruto (moeda da conta, sem conversão — ver BudgetEditor.tsx)
  bidStrategy?: string
  onUpdate: (id: string, bidAmount: number) => Promise<void>
  disabled?: boolean
  currency?: string
  minValue?: number
  maxValue?: number
}

// Estratégias em que bid_amount é um limite editável — mesma lista do backend
// (app/api/meta-business/adsets/[id]/bid/route.ts).
const BID_AMOUNT_STRATEGIES = new Set(['COST_CAP', 'LOWEST_COST_WITH_BID_CAP'])

export default function BidEditor({
  id,
  currentBid,
  bidStrategy,
  onUpdate,
  disabled = false,
  currency = 'USD',
  minValue = 0.01,
  maxValue = 1000000
}: BidEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [bid, setBid] = useState((currentBid ?? 0).toFixed(2))
  const [isUpdating, setIsUpdating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(value)
  }

  const parseInput = (value: string) => {
    const cleanValue = value.replace(/[^\d,.-]/g, '')
    const numericValue = parseFloat(cleanValue.replace(',', '.'))
    return Math.round(numericValue * 100) / 100
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    setBid((currentBid ?? 0).toFixed(2))
  }, [currentBid])

  // Editável só quando a estratégia de lance deste conjunto realmente usa um limite manual —
  // em lance automático (LOWEST_COST_WITHOUT_CAP) e ROAS mínimo (LOWEST_COST_WITH_MIN_ROAS) não
  // existe bid_amount pra editar (ver lib/types.ts).
  const canEdit = !disabled && !!bidStrategy && BID_AMOUNT_STRATEGIES.has(bidStrategy)

  const getNotApplicableLabel = () => {
    if (!bidStrategy || bidStrategy === 'LOWEST_COST_WITHOUT_CAP') return 'Automático'
    if (bidStrategy === 'LOWEST_COST_WITH_MIN_ROAS') return 'ROAS mínimo'
    return 'N/A'
  }

  const getTooltipMessage = () => {
    if (disabled) return 'Limite de lance não pode ser editado'
    if (!canEdit) {
      if (!bidStrategy || bidStrategy === 'LOWEST_COST_WITHOUT_CAP') {
        return 'Este conjunto usa lance automático (sem limite) — mude a estratégia de lance no Gerenciador de Anúncios da Meta pra habilitar um limite'
      }
      if (bidStrategy === 'LOWEST_COST_WITH_MIN_ROAS') {
        return 'Este conjunto usa ROAS mínimo como controle de lance, não um limite de lance fixo'
      }
      return 'Limite de lance não disponível para este conjunto'
    }
    return 'Clique para editar o limite de lance'
  }

  const handleStartEdit = () => {
    if (!canEdit) return
    setIsEditing(true)
    setBid((currentBid ?? 0).toFixed(2))
  }

  const handleCancel = () => {
    setIsEditing(false)
    setBid((currentBid ?? 0).toFixed(2))
  }

  const handleSave = async () => {
    if (!canEdit || isUpdating) return

    const numericBid = parseInput(bid)

    if (isNaN(numericBid) || numericBid < minValue) {
      toast.error(`Valor mínimo: ${formatCurrency(minValue)}`)
      return
    }

    if (numericBid > maxValue) {
      toast.error(`Valor máximo: ${formatCurrency(maxValue)}`)
      return
    }

    if (numericBid === currentBid) {
      setIsEditing(false)
      return
    }

    setIsUpdating(true)
    try {
      await onUpdate(id, numericBid)
      toast.success(`Limite de lance atualizado para ${formatCurrency(numericBid)}`)
      setIsEditing(false)
    } catch (error: any) {
      console.error('Erro ao atualizar limite de lance:', error)
      const errorMessage = error?.message || error?.error || 'Erro ao atualizar limite de lance'
      toast.error(errorMessage)
      setBid((currentBid ?? 0).toFixed(2))
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
    value = value.replace(/[^\d,.-]/g, '')

    const hasComma = value.includes(',')
    const hasDot = value.includes('.')
    if (hasComma && hasDot) {
      value = value.replace(/[.,]/g, (match, offset) => {
        return offset === value.lastIndexOf(match) ? match : ''
      })
    }
    setBid(value)
  }

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2 min-w-[140px] bg-white border border-blue-300 rounded-lg shadow-sm">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={bid}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 text-sm border-0 rounded-lg focus:outline-none focus:ring-0"
            placeholder="0.00"
            disabled={isUpdating}
          />
        </div>

        <div className="flex items-center space-x-1 pr-2">
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

  return (
    <div
      className={`flex items-center space-x-2 min-w-[120px] rounded px-3 py-0 transition-all duration-200 ${
        canEdit
          ? 'cursor-pointer group hover:bg-blue-50 hover:border-blue-200 border border-transparent hover:shadow-sm'
          : 'cursor-not-allowed opacity-60'
      }`}
      onClick={handleStartEdit}
      title={getTooltipMessage()}
    >
      <div className="flex items-center space-x-2 flex-1">
        {canEdit ? (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {formatCurrency(currentBid ?? 0)}
          </span>
        ) : (
          <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
            {getNotApplicableLabel()}
          </span>
        )}
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
