'use client'

import { AnimatePresence, motion } from 'framer-motion'
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
//
// Animação (revisada): trilho e thumb usam uma curva com leve "overshoot" (cubic-bezier tipo
// back-ease) em vez de um linear/ease padrão, pra dar a sensação de acabamento de switch nativo
// (iOS/Android) em vez de um corte seco de 150ms. O ícone dentro do thumb faz cross-fade (fade +
// leve scale, via framer-motion) ao trocar entre check/traço/spinner, em vez de aparecer/sumir
// instantaneamente. Um pequeno `active:scale-90` dá feedback tátil imediato ao clique, antes
// mesmo da resposta do servidor chegar.
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

// Curva com leve "overshoot" (passa um pouco do ponto final e assenta) — usada no deslocamento
// do thumb pra dar a sensação de acabamento de switch nativo.
const THUMB_EASE = 'cubic-bezier(0.34,1.56,0.64,1)'

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
  const iconKey = loading ? 'loading' : checked ? 'check' : 'minus'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      title={title}
      onClick={() => !isDisabled && onChange()}
      disabled={isDisabled}
      className={`relative inline-flex items-center rounded-full transition-all duration-200 ease-out flex-shrink-0 ${TRACK_SIZE[size]} ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-90'
      } ${TRACK_COLOR[resolvedVariant]} focus:outline-none focus:ring-2 focus:ring-offset-2 ${FOCUS_RING[resolvedVariant]}`}
    >
      <span
        style={{ transitionTimingFunction: THUMB_EASE }}
        className={`relative inline-flex items-center justify-center rounded-full bg-white shadow-sm transform transition-transform duration-300 ${THUMB_SIZE[size]} ${
          checked ? THUMB_TRAVEL[size].on : THUMB_TRAVEL[size].off
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={iconKey}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className={`${ICON_SIZE[size]} text-gray-400 animate-spin`} />
            ) : checked ? (
              <Check className={`${ICON_SIZE[size]} ${ICON_COLOR[resolvedVariant]}`} strokeWidth={3} />
            ) : (
              <Minus className={`${ICON_SIZE[size]} ${ICON_COLOR[resolvedVariant]}`} strokeWidth={3} />
            )}
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  )
}
