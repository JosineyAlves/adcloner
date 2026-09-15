'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { FacebookAccount } from '@/lib/types'
import toast from 'react-hot-toast'
import {
  readLocalCache,
  writeLocalCache,
  LOCAL_CACHE_KEYS
} from '@/lib/local-storage-cache'

interface AppContextType {
  accounts: FacebookAccount[]
  isLoading: boolean
  isRevalidating: boolean
  refreshAccounts: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  // Hidratar com o que estiver salvo no localStorage (se houver) para não mostrar tela vazia
  // enquanto a primeira busca real da sessão ainda não respondeu.
  const [accounts, setAccounts] = useState<FacebookAccount[]>(() => {
    const cached = readLocalCache<FacebookAccount[]>(LOCAL_CACHE_KEYS.facebookAccounts)
    return cached?.data || []
  })
  // Só bloqueia a tela com "Carregando..." se não havia nada em cache para mostrar de cara.
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const cached = readLocalCache<FacebookAccount[]>(LOCAL_CACHE_KEYS.facebookAccounts)
    return !cached
  })
  // Indica uma busca em segundo plano (revalidação) sem esconder os dados já exibidos.
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false)

  const fetchAccounts = async (isBackground: boolean) => {
    if (isBackground) {
      setIsRevalidating(true)
    }

    try {
      const response = await fetch('/api/facebook/accounts', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        const nextAccounts = data.accounts || []
        setAccounts(nextAccounts)
        writeLocalCache(LOCAL_CACHE_KEYS.facebookAccounts, nextAccounts)
      } else if (response.status === 401) {
        window.location.href = '/login'
        return
      } else {
        console.error('Failed to fetch accounts')
        // Se já temos dados em cache/tela, não interrompe o usuário com um toast de erro
        // por causa de uma revalidação silenciosa que falhou.
        if (!isBackground) {
          toast.error('Erro ao carregar contas do Facebook')
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
      if (!isBackground) {
        toast.error('Erro ao carregar contas do Facebook')
      }
    } finally {
      setIsLoading(false)
      setIsRevalidating(false)
    }
  }

  const refreshAccounts = async () => {
    setIsLoading(accounts.length === 0)
    await fetchAccounts(accounts.length > 0)
  }

  useEffect(() => {
    // Se já tínhamos dado em cache, isso roda como revalidação silenciosa em segundo plano;
    // caso contrário, é a busca inicial normal (com loading bloqueante).
    const hadCache = accounts.length > 0
    fetchAccounts(hadCache)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AppContext.Provider value={{
      accounts,
      isLoading,
      isRevalidating,
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
