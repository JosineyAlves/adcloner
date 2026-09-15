'use client'

import { useState } from 'react'
import ToggleSwitch from '@/components/ui/ToggleSwitch'

interface StatusToggleProps {
  id: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  effectiveStatus?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'CAMPAIGN_PAUSED' | 'CAMPAIGN_ARCHIVED'
  onToggle: (id: string, currentStatus: string) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

// Envolve o ToggleSwitch (components/ui/ToggleSwitch.tsx) com a lógica de negócio específica de
// campanhas/conjuntos/anúncios do Meta Ads: trilho verde quando ativo, cinza quando pausado,
// laranja quando pausado/arquivado por herança da campanha pai — mesmo padrão visual usado no
// toggle de sincronização da tela de Integrações.
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
  const isDisabled = disabled || status === 'ARCHIVED'

  const variant = isActive ? 'success' : isCampaignBlocked ? 'warning' : 'neutral'

  const handleToggle = () => {
    if (isDisabled || isLoading) return

    setIsLoading(true)

    // Simular delay mínimo para feedback visual
    setTimeout(() => {
      onToggle(id, status)
      setIsLoading(false)
    }, 100)
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
      <ToggleSwitch
        checked={isActive}
        onChange={handleToggle}
        disabled={isDisabled}
        loading={isLoading}
        size={size}
        variant={variant}
        title={getTooltipText()}
        ariaLabel={`${isActive ? 'Desativar' : 'Ativar'} item`}
      />
    </div>
  )
}
