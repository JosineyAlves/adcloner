'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { FacebookAccount } from '@/lib/types'
import toast from 'react-hot-toast'

interface AppContextType {
  accounts: FacebookAccount[]
  isLoading: boolean
  refreshAccounts: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [accounts, setAccounts] = useState<FacebookAccount[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/facebook/accounts', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts || [])
      } else if (response.status === 401) {
        window.location.href = '/login'
        return
      } else {
        console.error('Failed to fetch accounts')
        toast.error('Erro ao carregar contas do Facebook')
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
      toast.error('Erro ao carregar contas do Facebook')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshAccounts = async () => {
    setIsLoading(true)
    await fetchAccounts()
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  return (
    <AppContext.Provider value={{
      accounts,
      isLoading,
      refreshAccounts
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
