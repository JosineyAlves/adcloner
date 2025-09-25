'use client'

import { useState } from 'react'
import { Pause, Play } from 'lucide-react'

interface StatusToggleProps {
  status: 'ACTIVE' | 'PAUSED' | 'DELETED'
  onToggle: (newStatus: 'ACTIVE' | 'PAUSED') => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function StatusToggle({
  status,
  onToggle,
  disabled = false,
  size = 'md'
}: StatusToggleProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    if (disabled || isLoading || status === 'DELETED') return

    setIsLoading(true)
    try {
      const newStatus = status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
      await onToggle(newStatus)
    } finally {
      setIsLoading(false)
    }
  }

  const getToggleClasses = () => {
    const baseClasses = "relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
    
    const sizeClasses = {
      sm: "h-4 w-7",
      md: "h-5 w-9", 
      lg: "h-6 w-11"
    }

    const statusClasses = status === 'ACTIVE' 
      ? "bg-green-600 focus:ring-green-500" 
      : "bg-gray-200 focus:ring-gray-500"

    const disabledClasses = disabled || isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"

    return `${baseClasses} ${sizeClasses[size]} ${statusClasses} ${disabledClasses}`
  }

  const getThumbClasses = () => {
    const baseClasses = "inline-block bg-white rounded-full shadow transform transition-transform"
    
    const sizeClasses = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5"
    }

    const positionClasses = status === 'ACTIVE' 
      ? "translate-x-4" 
      : "translate-x-0"

    return `${baseClasses} ${sizeClasses[size]} ${positionClasses}`
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-2 h-2'
      case 'md': return 'w-3 h-3'
      case 'lg': return 'w-4 h-4'
      default: return 'w-3 h-3'
    }
  }

  return (
    <button
      type="button"
      className={getToggleClasses()}
      onClick={handleToggle}
      disabled={disabled || isLoading}
      aria-pressed={status === 'ACTIVE'}
      role="switch"
      title={status === 'ACTIVE' ? 'Clique para pausar' : 'Clique para ativar'}
    >
      <span className="sr-only">
        {status === 'ACTIVE' ? 'Ativar' : 'Pausar'}
      </span>
      <span className={getThumbClasses()}>
        {isLoading ? (
          <div className={`${getIconSize()} animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 mx-auto mt-0.5`} />
        ) : null}
      </span>
    </button>
  )
}
