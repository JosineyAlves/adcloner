'use client'

import { useState } from 'react'
import { ListChecks, CheckSquare, XSquare, PenSquare, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

interface BulkActionsMenuProps {
  selectedCount: number
  onActivate: () => void
  onDeactivate: () => void
  filterActive: boolean
  onToggleFilter: () => void
  // Presença de onBulkBidApply decide se o item "Alterar limite de lance" aparece — só faz
  // sentido no contexto de Conjuntos (bid_amount vive no Ad Set, nunca na Campanha, mesmo em CBO;
  // ver comentário em app/api/meta-business/adsets/[id]/bid/route.ts).
  bidEligibleCount?: number
  onBulkBidApply?: (bidAmount: number) => Promise<void>
}

// Botão único "Ações em massa", ao lado da engrenagem de colunas na barra de filtros — mesmo
// lugar/estilo do MetaBusinessMetricsSelector (ver components/meta-business/MetricsSelector.tsx).
// Reutilizado tanto na aba Campanhas quanto na aba Conjuntos (o pai decide o que cada botão faz
// via props, então o item de bid só aparece onde faz sentido).
export default function BulkActionsMenu({
  selectedCount,
  onActivate,
  onDeactivate,
  filterActive,
  onToggleFilter,
  bidEligibleCount,
  onBulkBidApply
}: BulkActionsMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [bidPopoverOpen, setBidPopoverOpen] = useState(false)
  const [bidValue, setBidValue] = useState('')
  const [isApplyingBid, setIsApplyingBid] = useState(false)

  if (selectedCount === 0) return null

  // Ícones minimalistas — mesma cor neutra pra todos, sem verde/laranja/azul por ação.
  const iconClass = 'w-4 h-4 text-gray-500 dark:text-gray-400'

  const handleBidApply = async () => {
    if (!onBulkBidApply) return
    const value = parseFloat(bidValue.replace(',', '.'))
    if (!value || value < 0.01) {
      toast.error('Informe um limite de lance válido (mínimo $0,01)')
      return
    }
    setIsApplyingBid(true)
    try {
      await onBulkBidApply(value)
      setBidValue('')
      setBidPopoverOpen(false)
    } finally {
      setIsApplyingBid(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setBidPopoverOpen(false)
          setMenuOpen(prev => !prev)
        }}
        title="Ações em massa"
        aria-label="Ações em massa"
        className="flex items-center justify-center p-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-ds-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors"
      >
        <ListChecks className={iconClass} />
      </button>

      {menuOpen && (
        <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
          <button
            onClick={() => { onActivate(); setMenuOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <CheckSquare className={iconClass} />
            Ativar selecionados
          </button>
          <button
            onClick={() => { onDeactivate(); setMenuOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <XSquare className={iconClass} />
            Desativar selecionados
          </button>
          {onBulkBidApply && (
            <button
              onClick={() => { setMenuOpen(false); setBidPopoverOpen(true) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <PenSquare className={iconClass} />
              Alterar limite de lance
            </button>
          )}
          <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
          <button
            onClick={() => { onToggleFilter(); setMenuOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Filter className={iconClass} />
            {filterActive ? 'Remover filtro' : 'Filtrar selecionados'}
          </button>
        </div>
      )}

      {/* Popover do limite de lance — flutua à parte do menu (nunca os dois abertos juntos). */}
      {bidPopoverOpen && onBulkBidApply && (
        <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-3">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Limite de lance (para {selectedCount} conjunto{selectedCount === 1 ? '' : 's'}
            {typeof bidEligibleCount === 'number' && bidEligibleCount !== selectedCount
              ? `, ${bidEligibleCount} com lance editável`
              : ''})
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={bidValue}
            onChange={(e) => setBidValue(e.target.value)}
            disabled={isApplyingBid}
            autoFocus
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 mb-2"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => { setBidPopoverOpen(false); setBidValue('') }}
              disabled={isApplyingBid}
              className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleBidApply}
              disabled={isApplyingBid || !bidValue}
              className="px-3 py-1 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              {isApplyingBid ? 'Aplicando...' : 'Aplicar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
