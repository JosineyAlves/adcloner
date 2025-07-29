'use client'

import { useState } from 'react'
import { Calendar, ChevronDown, X } from 'lucide-react'

export interface DatePreset {
  value: string
  label: string
  description?: string
}

export interface DateRange {
  since: string
  until: string
}

interface DateSelectorProps {
  datePreset: string
  customRange?: DateRange
  onDatePresetChange: (preset: string) => void
  onCustomRangeChange?: (range: DateRange) => void
}

const FACEBOOK_DATE_PRESETS: DatePreset[] = [
  {
    value: 'today',
    label: 'Hoje',
    description: 'Dados de hoje'
  },
  {
    value: 'yesterday',
    label: 'Ontem',
    description: 'Dados de ontem'
  },
  {
    value: 'last_7d',
    label: 'Últimos 7 dias',
    description: 'Últimos 7 dias'
  },
  {
    value: 'last_14d',
    label: 'Últimos 14 dias',
    description: 'Últimos 14 dias'
  },
  {
    value: 'last_28d',
    label: 'Últimos 28 dias',
    description: 'Últimos 28 dias'
  },
  {
    value: 'last_30d',
    label: 'Últimos 30 dias',
    description: 'Últimos 30 dias'
  },
  {
    value: 'this_week',
    label: 'Esta semana',
    description: 'De segunda a domingo da semana atual'
  },
  {
    value: 'last_week',
    label: 'Semana passada',
    description: 'De segunda a domingo da semana passada'
  },
  {
    value: 'this_month',
    label: 'Este mês',
    description: 'Do dia 1 ao último dia do mês atual'
  },
  {
    value: 'last_month',
    label: 'Mês passado',
    description: 'Do dia 1 ao último dia do mês passado'
  },
  {
    value: 'maximum',
    label: 'Máximo',
    description: 'Máximo de dados disponíveis'
  },
  {
    value: 'custom',
    label: 'Personalizado',
    description: 'Selecione um período personalizado'
  }
]

export default function DateSelector({
  datePreset,
  customRange,
  onDatePresetChange,
  onCustomRangeChange
}: DateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCustomRange, setShowCustomRange] = useState(false)
  const [tempCustomRange, setTempCustomRange] = useState<DateRange>({
    since: customRange?.since || '',
    until: customRange?.until || ''
  })

  const selectedPreset = FACEBOOK_DATE_PRESETS.find(p => p.value === datePreset)

  const handlePresetSelect = (preset: string) => {
    onDatePresetChange(preset)
    if (preset === 'custom') {
      setShowCustomRange(true)
    } else {
      setShowCustomRange(false)
    }
    setIsOpen(false)
  }

  const handleCustomRangeSave = () => {
    if (onCustomRangeChange && tempCustomRange.since && tempCustomRange.until) {
      onCustomRangeChange(tempCustomRange)
      setIsOpen(false)
    }
  }

  const handleCustomRangeCancel = () => {
    setTempCustomRange({
      since: customRange?.since || '',
      until: customRange?.until || ''
    })
    setShowCustomRange(false)
    onDatePresetChange('last_7d')
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {selectedPreset?.label || 'Selecionar período'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Período de Tempo
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!showCustomRange ? (
              <div className="space-y-1">
                {FACEBOOK_DATE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handlePresetSelect(preset.value)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      datePreset === preset.value
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium">{preset.label}</div>
                    {preset.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {preset.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={tempCustomRange.since}
                    onChange={(e) => setTempCustomRange(prev => ({ ...prev, since: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data de Fim
                  </label>
                  <input
                    type="date"
                    value={tempCustomRange.until}
                    onChange={(e) => setTempCustomRange(prev => ({ ...prev, until: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCustomRangeSave}
                    disabled={!tempCustomRange.since || !tempCustomRange.until}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Aplicar
                  </button>
                  <button
                    onClick={handleCustomRangeCancel}
                    className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 