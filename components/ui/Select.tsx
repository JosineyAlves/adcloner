'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'
import { useFloatingPosition } from './useFloatingPosition'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
}

// Select customizado — substitui o <select> nativo do navegador. A lista de opções de um
// <select> nativo é renderizada pelo motor do SO/navegador (destaque azul no hover, fonte do
// sistema) e não pode ser restilizada via CSS/Tailwind. Este componente reproduz o mesmo
// comportamento (clique para abrir, seleção, fechamento ao clicar fora) com a aparência do
// design system, usando portal + position:fixed (useFloatingPosition) para não ser cortado por
// containers com overflow.
export default function Select({ value, onChange, options, placeholder = 'Selecionar', className = '' }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  const triggerWidth = triggerRef.current?.offsetWidth || 240
  const position = useFloatingPosition(triggerRef, isOpen, triggerWidth, 264)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between px-3 py-2 border rounded-ds-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors w-full min-w-0 ${
          isOpen
            ? 'border-brand-500 ring-2 ring-brand-500'
            : 'border-gray-300 dark:border-gray-600 hover:border-brand-400'
        } ${className}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {mounted && isOpen && createPortal(
        <div
          ref={popoverRef}
          style={{ position: 'fixed', top: position.top, left: position.left, width: triggerWidth }}
          className="z-[100] max-h-64 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-ds-md shadow-lg py-1"
        >
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between text-left px-3 py-2 text-sm transition-colors ${
                  isSelected
                    ? 'bg-brand-100 dark:bg-brand-500/10 text-black dark:text-brand-300 font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="w-4 h-4 flex-shrink-0 ml-2" />}
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </>
  )
}
