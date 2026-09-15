'use client'

import { useState } from 'react'
import { Check, Minus, Loader2 } from 'lucide-react'

interface StatusToggleProps {
  id: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  effectiveStatus?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'CAMPAIGN_PAUSED' | 'CAMPAIGN_ARCHIVED'
  onToggle: (id: string, currentStatus: string) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

// Indicador de status em formato de badge circular (check verde = ativo, traço cinza = pausado)
// — substitui o switch em formato de pílula usado antes, seguindo referência visual mais moderna
// (estilo "checkbox de status" usado em trackers como a UTMify).
//
// O verde do estado ativo é proposital e NÃO vem da paleta de marca (brand-500/#CEFF00): pedido
// explícito para destacar "ativo" com um verde de sucesso/positivo, que tem reconhecimento
// universal mais forte que o lime da marca para esse tipo de indicador crítico em uma tabela
// densa de dados.
export default function StatusToggle({
  id,
  status,
  effectiveStatus,
  onToggle,
  disabled = false,
  size = 'md'
}: StatusToggleProps) {
  const [isLoading, setIsLoading] = useState(false)

  const isActive = status === 'ACTIVE'
  const isCampaignBlocked = effectiveStatus === 'CAMPAIGN_PAUSED' || effectiveStatus === 'CAMPAIGN_ARCHIVED'
  const isDisabled = disabled || isLoading || status === 'ARCHIVED'

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7'
  }

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  }

  const handleToggle = () => {
    if (isDisabled) return

    setIsLoading(true)

    // Simular delay mínimo para feedback visual
    setTimeout(() => {
      onToggle(id, status)
      setIsLoading(false)
    }, 100)
  }

  const getBadgeColor = () => {
    if (isActive) {
      return 'bg-green-500 hover:bg-green-600'
    }
    if (isCampaignBlocked) {
      return 'bg-orange-400 hover:bg-orange-500'
    }
    return 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
  }

  const getFocusRingColor = () => {
    if (isActive) return 'focus:ring-green-500'
    if (isCampaignBlocked) return 'focus:ring-orange-400'
    return 'focus:ring-gray-400'
  }

  const getTooltipText = () => {
    if (effectiveStatus === 'CAMPAIGN_PAUSED') {
      return 'Pausado pela campanha'
    }
    if (effectiveStatus === 'CAMPAIGN_ARCHIVED') {
      return 'Arquivado pela campanha'
    }
    if (status === 'ARCHIVED') {
      return 'Arquivado'
    }
    return isActive ? 'Ativo' : 'Pausado'
  }

  return (
    <div className="flex items-center">
      <button
        onClick={handleToggle}
        disabled={isDisabled}
        className={`
          relative inline-flex items-center justify-center rounded-full transition-colors duration-150
          ${sizeClasses[size]}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${getBadgeColor()}
          focus:outline-none focus:ring-2 ${getFocusRingColor()} focus:ring-offset-2
        `}
        title={getTooltipText()}
        aria-label={`${isActive ? 'Desativar' : 'Ativar'} item`}
        role="switch"
        aria-checked={isActive}
      >
        {isLoading ? (
          <Loader2 className={`${iconSizeClasses[size]} text-white animate-spin`} />
        ) : isActive ? (
          <Check className={`${iconSizeClasses[size]} text-white`} strokeWidth={3} />
        ) : (
          <Minus className={`${iconSizeClasses[size]} text-white`} strokeWidth={3} />
        )}
      </button>
    </div>
  )
}
