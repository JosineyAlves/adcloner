'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'
import { useFloatingPosition } from './useFloatingPosition'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  value: string[]
  onChange: (value: string[]) => void
  options: MultiSelectOption[]
  allLabel?: string
  placeholder?: string
  className?: string
}

// Variante multi-seleção do Select.tsx — mesmo padrão visual (botão + painel flutuante via
// portal, mesma classe/tamanho/cores do trigger) e mesmo comportamento de abrir/fechar ao
// clicar fora, mas cada opção clicada entra/sai da seleção sem fechar o painel (precisa dar pra
// marcar várias antes de fechar) e usa checkbox em vez de um Check único. Usado no filtro
// "Conta de Anúncio" do Meta Ads Manager para permitir escolher mais de uma conta de uma vez,
// mantendo a mesma linguagem visual do seletor de conta única usado no resto do painel.
export default function MultiSelect({
  value,
  onChange,
  options,
  allLabel = 'Todas as Contas',
  placeholder = 'Selecionar',
  className = ''
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  const triggerWidth = triggerRef.current?.offsetWidth || 240
  const position = useFloatingPosition(triggerRef, isOpen, triggerWidth, 288)

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

  // Nenhuma selecionada ou todas selecionadas contam visualmente como "Todas as Contas" — mesma
  // semântica de "sem filtro" usada no restante da tela (ver filters.accountIds em page.tsx).
  const isAllSelected = value.length === 0 || value.length === options.length
  const triggerLabel = isAllSelected
    ? allLabel
    : value.length === 1
      ? (options.find((opt) => opt.value === value[0])?.label || placeholder)
      : `${value.length} contas selecionadas`

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between px-3 py-1.5 border rounded-ds-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors w-full min-w-0 ${
          isOpen
            ? 'border-brand-500 ring-2 ring-brand-500'
            : 'border-gray-300 dark:border-gray-600 hover:border-brand-400'
        } ${className}`}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {mounted && isOpen && createPortal(
        <div
          ref={popoverRef}
          style={{ position: 'fixed', top: position.top, left: position.left, width: triggerWidth }}
          className="z-[100] max-h-64 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-ds-md shadow-lg py-1"
        >
          <button
            type="button"
            onClick={() => onChange([])}
            className={`w-full flex items-center justify-between text-left px-3 py-2 text-sm transition-colors border-b border-gray-100 dark:border-gray-700 ${
              isAllSelected
                ? 'bg-brand-100 dark:bg-brand-500/10 text-black dark:text-brand-300 font-semibold'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <span className="truncate">{allLabel}</span>
            {isAllSelected && <Check className="w-4 h-4 flex-shrink-0 ml-2" />}
          </button>

          {options.map((option) => {
            const isSelected = value.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleOption(option.value)}
                className={`w-full flex items-center gap-2 text-left px-3 py-2 text-sm transition-colors ${
                  isSelected
                    ? 'bg-brand-100 dark:bg-brand-500/10 text-black dark:text-brand-300 font-semibold'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span
                  className={`w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center ${
                    isSelected
                      ? 'bg-brand-500 border-brand-500'
                      : 'border-gray-300 dark:border-gray-500'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </span>
                <span className="truncate">{option.label}</span>
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </>
  )
}
