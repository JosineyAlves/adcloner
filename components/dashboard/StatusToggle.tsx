'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface StatusToggleProps {
  id: string
  currentStatus: 'ACTIVE' | 'PAUSED'
  type: 'campaign' | 'adset' | 'ad'
  onStatusChange?: (id: string, newStatus: 'ACTIVE' | 'PAUSED') => void
  disabled?: boolean
}

export default function StatusToggle({ 
  id, 
  currentStatus, 
  type, 
  onStatusChange,
  disabled = false 
}: StatusToggleProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'ACTIVE' | 'PAUSED'>(currentStatus)

  const handleToggle = async () => {
    if (disabled || isLoading) return

    const newStatus = status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    setIsLoading(true)

    try {
      // Determinar o endpoint baseado no tipo
      let endpoint = ''
      switch (type) {
        case 'campaign':
          endpoint = `/api/campaigns/${id}/status`
          break
        case 'adset':
          endpoint = `/api/adsets/${id}/status`
          break
        case 'ad':
          endpoint = `/api/ads/${id}/status`
          break
      }

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()

      if (data.success) {
        setStatus(newStatus)
        onStatusChange?.(id, newStatus)
        toast.success(data.message)
      } else {
        toast.error(data.message || 'Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Erro ao atualizar status')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center">
      <button
        onClick={handleToggle}
        disabled={disabled || isLoading}
        className={`
          relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          ${isLoading ? 'opacity-70' : ''}
          ${status === 'ACTIVE' 
            ? 'bg-primary-600' 
            : 'bg-gray-300 dark:bg-gray-600'
          }
        `}
        aria-label={`${status === 'ACTIVE' ? 'Desativar' : 'Ativar'} ${type}`}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
            ${status === 'ACTIVE' ? 'translate-x-4' : 'translate-x-0.5'}
            ${isLoading ? 'animate-pulse' : ''}
          `}
        />
      </button>
      
      {isLoading && (
        <div className="ml-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-600"></div>
        </div>
      )}
    </div>
  )
}
