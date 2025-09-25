'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Play, Pause, Archive } from 'lucide-react'

interface BulkActionsButtonProps {
  type: 'campaigns' | 'adsets' | 'ads'
  selectedCount: number
  onActivate: () => void
  onPause: () => void
  onArchive: () => void
}

export default function BulkActionsButton({
  type,
  selectedCount,
  onActivate,
  onPause,
  onArchive
}: BulkActionsButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const getTypeLabel = () => {
    switch (type) {
      case 'campaigns': return 'Campanhas'
      case 'adsets': return 'Conjuntos'
      case 'ads': return 'Anúncios'
      default: return 'Itens'
    }
  }

  const actions = [
    {
      id: 'activate',
      label: 'Ativar',
      icon: Play,
      onClick: onActivate,
      className: 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
    },
    {
      id: 'pause',
      label: 'Pausar',
      icon: Pause,
      onClick: onPause,
      className: 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
    },
    {
      id: 'archive',
      label: 'Arquivar',
      icon: Archive,
      onClick: onArchive,
      className: 'text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20'
    }
  ]

  if (selectedCount === 0) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200 text-sm font-medium"
      >
        <span>Ações em massa</span>
        <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
          {selectedCount}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.id}
                onClick={() => {
                  action.onClick()
                  setIsOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-sm ${action.className} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200`}
              >
                <Icon className="w-4 h-4" />
                <span>{action.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
