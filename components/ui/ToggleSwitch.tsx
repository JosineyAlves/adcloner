'use client'

import { Check, Minus, Loader2 } from 'lucide-react'

export type ToggleSwitchVariant = 'success' | 'neutral' | 'warning'

interface ToggleSwitchProps {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: ToggleSwitchVariant
  title?: string
  ariaLabel?: string
}

// Switch de pílula compartilhado por todo o projeto — usado pelo StatusToggle (tabelas de
// Campanhas/Conjuntos/Anúncios) e pelo toggle de sincronização de contas na tela de Integrações,
// para os dois seguirem exatamente o mesmo padrão visual: trilho verde quando ligado, cinza
// quando desligado, laranja para o estado "bloqueado por herança" (ex.: anúncio ativo mas
// pausado pela campanha pai). O "thumb" (bolinha) sempre exibe um ícone — check ligado, traço
// desligado — em vez de ficar em branco, para o estado ficar claro sem depender só da cor.
const TRACK_SIZE = {
  sm: 'w-8 h-4',
  md: 'w-9 h-5',
  lg: 'w-12 h-6'
}

const THUMB_SIZE = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-5 h-5'
}

const THUMB_TRAVEL = {
  sm: { on: 'translate-x-4', off: 'translate-x-0.5' },
  md: { on: 'translate-x-4', off: 'translate-x-0.5' },
  lg: { on: 'translate-x-6', off: 'translate-x-0.5' }
}

const ICON_SIZE = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3.5 h-3.5'
}

const TRACK_COLOR: Record<ToggleSwitchVariant, string> = {
  success: 'bg-green-500',
  neutral: 'bg-gray-300 dark:bg-gray-600',
  warning: 'bg-orange-400'
}

const ICON_COLOR: Record<ToggleSwitchVariant, string> = {
  success: 'text-green-600',
  neutral: 'text-gray-400',
  warning: 'text-orange-500'
}

const FOCUS_RING: Record<ToggleSwitchVariant, string> = {
  success: 'focus:ring-green-500',
  neutral: 'focus:ring-gray-400',
  warning: 'focus:ring-orange-400'
}

export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  loading = false,
  size = 'md',
  variant,
  title,
  ariaLabel
}: ToggleSwitchProps) {
  const resolvedVariant: ToggleSwitchVariant = variant || (checked ? 'success' : 'neutral')
  const isDisabled = disabled || loading

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      title={title}
      onClick={() => !isDisabled && onChange()}
      disabled={isDisabled}
      className={`relative inline-flex items-center rounded-full transition-colors duration-150 flex-shrink-0 ${TRACK_SIZE[size]} ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${TRACK_COLOR[resolvedVariant]} focus:outline-none focus:ring-2 focus:ring-offset-2 ${FOCUS_RING[resolvedVariant]}`}
    >
      <span
        className={`inline-flex items-center justify-center rounded-full bg-white shadow-sm transform transition-transform duration-150 ${THUMB_SIZE[size]} ${
          checked ? THUMB_TRAVEL[size].on : THUMB_TRAVEL[size].off
        }`}
      >
        {loading ? (
          <Loader2 className={`${ICON_SIZE[size]} text-gray-400 animate-spin`} />
        ) : checked ? (
          <Check className={`${ICON_SIZE[size]} ${ICON_COLOR[resolvedVariant]}`} strokeWidth={3} />
        ) : (
          <Minus className={`${ICON_SIZE[size]} ${ICON_COLOR[resolvedVariant]}`} strokeWidth={3} />
        )}
      </span>
    </button>
  )
}
