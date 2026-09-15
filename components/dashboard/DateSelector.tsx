'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X, Calendar as CalendarIcon } from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'
import Calendar from './Calendar'

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
    // 'this_week'/'last_week' (sem sufixo) NÃO são valores válidos de `date_preset` na Graph API
    // — os enums oficiais exigem o sufixo de convenção de semana (_mon_sun ou _sun_sat). Usamos
    // mon_sun (segunda a domingo) por bater com a descrição já usada aqui.
    value: 'this_week_mon_sun',
    label: 'Esta semana',
    description: 'De segunda a domingo da semana atual'
  },
  {
    value: 'last_week_mon_sun',
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
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom')
  const [dropdownAlignment, setDropdownAlignment] = useState<'left' | 'right'>('left')
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [tempCustomRange, setTempCustomRange] = useState<DateRange>({
    since: customRange?.since || '',
    until: customRange?.until || ''
  })

  // Campo de calendário customizado aberto ('since'/'until'/none) — substitui o date picker
  // nativo do navegador, que não pode ser restilizado com a cor de marca.
  const [openField, setOpenField] = useState<'since' | 'until' | null>(null)
  const customRangeRef = useRef<HTMLDivElement>(null)

  // Fecha o calendário aberto ao clicar fora dele.
  useEffect(() => {
    if (!openField) return
    const handleClickOutside = (e: MouseEvent) => {
      if (customRangeRef.current && !customRangeRef.current.contains(e.target as Node)) {
        setOpenField(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openField])

  const selectedPreset = FACEBOOK_DATE_PRESETS.find(p => p.value === datePreset)

  // Detectar se é mobile e recalcular posição
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    const recalculatePosition = () => {
      if (isOpen) {
        // Recalcular posição quando a janela for redimensionada
        const containerRect = containerRef.current?.getBoundingClientRect()
        if (containerRect) {
          const dropdownHeight = 400
          const dropdownWidth = 320
          const viewportHeight = window.innerHeight
          const viewportWidth = window.innerWidth
          
          const spaceBelow = viewportHeight - containerRect.bottom
          const spaceAbove = containerRect.top
          const spaceRight = viewportWidth - containerRect.left
          const spaceLeft = containerRect.left
          
          if (!isMobile) {
            if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
              setDropdownPosition('top')
            } else {
              setDropdownPosition('bottom')
            }
            
            if (spaceRight < dropdownWidth && spaceLeft > spaceRight) {
              setDropdownAlignment('right')
            } else {
              setDropdownAlignment('left')
            }
          }
        }
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    window.addEventListener('resize', recalculatePosition)
    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('resize', recalculatePosition)
    }
  }, [isOpen, isMobile])

  // Calcular posição inicial quando abrir
  useEffect(() => {
    if (isOpen && containerRef.current && !isMobile) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const dropdownHeight = 400
      const dropdownWidth = 320
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      
      const spaceBelow = viewportHeight - containerRect.bottom
      const spaceAbove = containerRect.top
      const spaceRight = viewportWidth - containerRect.left
      const spaceLeft = containerRect.left
      
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition('top')
      } else {
        setDropdownPosition('bottom')
      }
      
      if (spaceRight < dropdownWidth && spaceLeft > spaceRight) {
        setDropdownAlignment('right')
      } else {
        setDropdownAlignment('left')
      }
    }
  }, [isOpen, isMobile])

  const handlePresetSelect = (preset: string) => {
    if (preset === 'custom') {
      // Não avisa o componente pai ainda (não chama onDatePresetChange) — 'custom' não é um
      // valor válido de `date_preset` da Graph API (ver lib/facebook-batch-api.ts), então só deve
      // virar o período ativo quando o usuário efetivamente aplicar um `since`/`until` válido
      // (handleCustomRangeSave, abaixo). Antes disso, mudar o estado aqui já disparava uma busca
      // automática com `date_preset=custom` e nenhum `time_range` ainda — erro garantido na Meta.
      setShowCustomRange(true)
      return
    }
    setShowCustomRange(false)
    onDatePresetChange(preset)
    setIsOpen(false)
  }

  const handleCustomRangeSave = () => {
    if (onCustomRangeChange && tempCustomRange.since && tempCustomRange.until) {
      // Aplica os dois de uma vez: 'custom' como período ativo + o range em si, para nunca existir
      // um estado intermediário em que datePreset já é 'custom' mas customRange ainda não existe.
      onDatePresetChange('custom')
      onCustomRangeChange(tempCustomRange)
      setIsOpen(false)
      setOpenField(null)
    }
  }

  const handleCustomRangeCancel = () => {
    setTempCustomRange({
      since: customRange?.since || '',
      until: customRange?.until || ''
    })
    setShowCustomRange(false)
    setOpenField(null)
    // Com o fix acima, abrir o editor de período personalizado não muda mais `datePreset` no
    // componente pai (só muda ao clicar "Aplicar") — então cancelar não precisa mais forçar
    // nenhum período de volta, o que já estava selecionado antes continua ativo.
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 sm:px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full sm:w-auto min-w-0"
      >
        <span className="text-sm font-medium text-gray-900 dark:text-white truncate min-w-0">
          {selectedPreset?.label || 'Selecionar período'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay para mobile */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          <div 
            ref={dropdownRef}
            className={`${
              isMobile 
                ? 'fixed left-2 right-2 bottom-2 top-auto' 
                : 'absolute'
            } w-80 max-w-[calc(100vw-1rem)] sm:max-w-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 ${
              !isMobile && dropdownPosition === 'top' 
                ? 'bottom-full mb-1' 
                : !isMobile 
                ? 'top-full mt-1' 
                : ''
            } ${
              !isMobile && dropdownAlignment === 'right' 
                ? 'right-0' 
                : !isMobile 
                ? 'left-0' 
                : ''
            }`}
          >
            <div className="p-3 sm:p-4 max-h-[70vh] sm:max-h-[80vh] overflow-y-auto">
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
                    className={`w-full text-left px-3 py-2 rounded-ds-md text-sm transition-colors ${
                      datePreset === preset.value
                        ? 'bg-brand-100 dark:bg-brand-500/10 text-black dark:text-brand-300 font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium">{preset.label}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4" ref={customRangeRef}>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data de Início
                  </label>
                  <button
                    type="button"
                    onClick={() => setOpenField(prev => prev === 'since' ? null : 'since')}
                    className={`w-full flex items-center justify-between px-3 py-2 border rounded-ds-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                      openField === 'since'
                        ? 'border-brand-500 ring-1 ring-brand-500'
                        : 'border-gray-300 dark:border-gray-600 hover:border-brand-400'
                    }`}
                  >
                    <span className={tempCustomRange.since ? '' : 'text-gray-400'}>
                      {tempCustomRange.since && isValid(parseISO(tempCustomRange.since))
                        ? format(parseISO(tempCustomRange.since), 'dd/MM/yyyy')
                        : 'dd/mm/aaaa'}
                    </span>
                    <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </button>
                  {openField === 'since' && (
                    <div className="absolute left-0 top-full mt-1 z-50">
                      <Calendar
                        selected={tempCustomRange.since && isValid(parseISO(tempCustomRange.since)) ? parseISO(tempCustomRange.since) : null}
                        onSelect={(date) => {
                          setTempCustomRange(prev => ({ ...prev, since: format(date, 'yyyy-MM-dd') }))
                          setOpenField(null)
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data de Fim
                  </label>
                  <button
                    type="button"
                    onClick={() => setOpenField(prev => prev === 'until' ? null : 'until')}
                    className={`w-full flex items-center justify-between px-3 py-2 border rounded-ds-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                      openField === 'until'
                        ? 'border-brand-500 ring-1 ring-brand-500'
                        : 'border-gray-300 dark:border-gray-600 hover:border-brand-400'
                    }`}
                  >
                    <span className={tempCustomRange.until ? '' : 'text-gray-400'}>
                      {tempCustomRange.until && isValid(parseISO(tempCustomRange.until))
                        ? format(parseISO(tempCustomRange.until), 'dd/MM/yyyy')
                        : 'dd/mm/aaaa'}
                    </span>
                    <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </button>
                  {openField === 'until' && (
                    <div className="absolute left-0 top-full mt-1 z-50">
                      <Calendar
                        selected={tempCustomRange.until && isValid(parseISO(tempCustomRange.until)) ? parseISO(tempCustomRange.until) : null}
                        minDate={tempCustomRange.since && isValid(parseISO(tempCustomRange.since)) ? parseISO(tempCustomRange.since) : undefined}
                        onSelect={(date) => {
                          setTempCustomRange(prev => ({ ...prev, until: format(date, 'yyyy-MM-dd') }))
                          setOpenField(null)
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCustomRangeSave}
                    disabled={!tempCustomRange.since || !tempCustomRange.until}
                    className="flex-1 px-3 py-2 bg-brand-500 text-black text-sm font-medium rounded-ds-md hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Aplicar
                  </button>
                  <button
                    onClick={handleCustomRangeCancel}
                    className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-ds-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </>
      )}
    </div>
  )
} 