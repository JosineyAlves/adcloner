'use client'

import { Play, Pause, Archive, X } from 'lucide-react'

interface SelectionIndicatorProps {
  type: 'campaigns' | 'adsets' | 'ads'
  count: number
  onActivate: () => void
  onPause: () => void
  onArchive: () => void
  onClear: () => void
}

export default function SelectionIndicator({
  type,
  count,
  onActivate,
  onPause,
  onArchive,
  onClear
}: SelectionIndicatorProps) {
  if (count === 0) return null

  const getTypeLabel = () => {
    switch (type) {
      case 'campaigns': return 'campanha'
      case 'adsets': return 'conjunto'
      case 'ads': return 'anúncio'
      default: return 'item'
    }
  }

  const getTypeLabelPlural = () => {
    switch (type) {
      case 'campaigns': return 'campanhas'
      case 'adsets': return 'conjuntos'
      case 'ads': return 'anúncios'
      default: return 'itens'
    }
  }

  const typeLabel = count === 1 ? getTypeLabel() : getTypeLabelPlural()

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        {/* Indicador de seleção */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-blue-900">
              {count} {typeLabel} selecionada{count > 1 ? 's' : ''}
            </span>
            <button
              onClick={onClear}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ações em massa */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onActivate}
            className="flex items-center space-x-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
          >
            <Play className="w-3 h-3" />
            <span>Ativar</span>
          </button>
          
          <button
            onClick={onPause}
            className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors text-sm font-medium"
          >
            <Pause className="w-3 h-3" />
            <span>Pausar</span>
          </button>
          
          <button
            onClick={onArchive}
            className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <Archive className="w-3 h-3" />
            <span>Arquivar</span>
          </button>
        </div>
      </div>
    </div>
  )
}
