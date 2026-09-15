'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Calendário customizado — substitui o seletor de data nativo do navegador (<input type="date">)
// nos campos "Data de Início"/"Data de Fim" do DateSelector. O calendário nativo do SO/navegador
// não pode ser restilizado via CSS (mesma limitação dos <select> nativos), então construímos este
// componente próprio seguindo a paleta e o radius do design system.
interface CalendarProps {
  selected?: Date | null
  onSelect: (date: Date) => void
  minDate?: Date
  maxDate?: Date
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export default function Calendar({ selected, onSelect, minDate, maxDate }: CalendarProps) {
  const [visibleMonth, setVisibleMonth] = useState<Date>(selected || new Date())

  const monthStart = startOfMonth(visibleMonth)
  const monthEnd = endOfMonth(visibleMonth)
  const gridStart = startOfWeek(monthStart)
  const gridEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const isDisabled = (day: Date) => {
    if (minDate && day < minDate) return true
    if (maxDate && day > maxDate) return true
    return false
  }

  return (
    <div className="w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-ds-lg shadow-lg p-3">
      {/* Header: mês/ano + navegação */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setVisibleMonth((prev) => subMonths(prev, 1))}
          className="p-1 rounded-ds-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 transition-colors"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
          {format(visibleMonth, "MMMM 'de' yyyy", { locale: ptBR })}
        </span>
        <button
          type="button"
          onClick={() => setVisibleMonth((prev) => addMonths(prev, 1))}
          className="p-1 rounded-ds-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 transition-colors"
          aria-label="Próximo mês"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map((label, idx) => (
          <div key={idx} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">
            {label}
          </div>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day) => {
          const outOfMonth = !isSameMonth(day, visibleMonth)
          const disabled = isDisabled(day)
          const isSelected = selected ? isSameDay(day, selected) : false
          const today = isToday(day)

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(day)}
              className={`w-full aspect-square flex items-center justify-center text-sm rounded-ds-sm transition-colors ${
                isSelected
                  ? 'bg-brand-500 text-black font-semibold'
                  : outOfMonth
                  ? 'text-gray-300 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              } ${today && !isSelected ? 'ring-1 ring-inset ring-brand-500' : ''} ${
                disabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent' : ''
              }`}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>

      {/* Ação rápida */}
      <div className="flex justify-end mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button
          type="button"
          onClick={() => {
            const now = new Date()
            setVisibleMonth(now)
            onSelect(now)
          }}
          className="text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
        >
          Hoje
        </button>
      </div>
    </div>
  )
}
