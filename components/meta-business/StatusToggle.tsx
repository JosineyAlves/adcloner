'use client'

import { useState } from 'react'

interface StatusToggleProps {
  id: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  effectiveStatus?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'CAMPAIGN_PAUSED' | 'CAMPAIGN_ARCHIVED'
  onToggle: (id: string, currentStatus: string) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

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
  const isDisabled = disabled || isLoading || status === 'ARCHIVED'
  
  const sizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-10 h-5',
    lg: 'w-12 h-6'
  }
  
  const thumbSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
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

  const getStatusColor = () => {
    if (isActive) {
      return 'bg-[#035C8E]'
    }
    if (effectiveStatus === 'CAMPAIGN_PAUSED' || effectiveStatus === 'CAMPAIGN_ARCHIVED') {
      return 'bg-orange-500'
    }
    return 'bg-gray-400'
  }

  const getThumbColor = () => {
    if (isActive) {
      return 'bg-white'
    }
    if (effectiveStatus === 'CAMPAIGN_PAUSED' || effectiveStatus === 'CAMPAIGN_ARCHIVED') {
      return 'bg-orange-100'
    }
    return 'bg-gray-200'
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
    <div className="flex items-center space-x-2">
      <button
        onClick={handleToggle}
        disabled={isDisabled}
        className={`
          relative inline-flex items-center rounded-full transition-all duration-200 ease-in-out
          ${sizeClasses[size]}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
          ${getStatusColor()}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        title={getTooltipText()}
        aria-label={`${isActive ? 'Desativar' : 'Ativar'} item`}
        role="switch"
        aria-checked={isActive}
      >
        <span
          className={`
            inline-block rounded-full transition-transform duration-200 ease-in-out
            ${thumbSizeClasses[size]}
            ${isActive ? 'translate-x-5' : 'translate-x-0.5'}
            ${getThumbColor()}
            flex items-center justify-center
          `}
        >
          {isLoading && (
            <div className="w-2 h-2 animate-spin">
              <div className="w-full h-full border-2 border-gray-400 border-t-transparent rounded-full" />
            </div>
          )}
        </span>
      </button>
    </div>
  )
}
