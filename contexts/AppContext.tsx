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

  // Mesmo mapeamento de status numérico da Graph API usado em lib/facebook-api.ts
  // (FacebookAPI.mapAccountStatus, privado naquela classe — duplicado aqui porque
  // /api/meta/accounts devolve o account_status bruto salvo no Supabase).
  const mapAccountStatus = (status: number | null): 'active' | 'disabled' | 'pending' => {
    switch (status) {
      case 1: return 'active'
      case 2: return 'disabled'
      case 3: return 'pending'
      default: return 'pending'
    }
  }

  const fetchAccounts = async (isBackground: boolean) => {
    if (isBackground) {
      setIsRevalidating(true)
    }

    try {
      // Fonte principal: TODAS as contas de anúncio de TODAS as conexões já descobertas e
      // salvas no Supabase (/api/meta/accounts, ver lib/meta-connections.ts) — ao contrário de
      // /api/facebook/accounts, que busca ao vivo na Graph API usando só o cookie fb_access_token
      // da ÚLTIMA conta conectada. Era exatamente esse o motivo do bug "ao adicionar outra conta,
      // a anterior sumia do painel": o cookie é sobrescrito a cada novo login, então a busca ao
      // vivo só enxergava a conta mais recente.
      const response = await fetch('/api/meta/accounts', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        // Importante: `data.accounts.length === 0` é uma resposta válida e definitiva (usuário
        // desconectou todos os perfis em Integrações) — não deve cair no fallback legado abaixo,
        // que buscaria ao vivo pelo cookie fb_access_token (que pode estar obsoleto/apontando
        // pra uma conexão já removida) e faria uma conta "removida" reaparecer na tela Contas,
        // que nem tem como removê-la de volta. Só cai pro fallback se a resposta não veio no
        // formato esperado (data.success ausente/false ou accounts não é array).
        if (data.success && Array.isArray(data.accounts)) {
          const nextAccounts: FacebookAccount[] = data.accounts.map((acc: any) => {
            const rawId: string = acc.metaAccountId || acc.id
            return {
              id: rawId.startsWith('act_') ? rawId : `act_${rawId}`,
              name: acc.name || rawId,
              businessManagerId: acc.businessName || 'Unknown',
              businessManagerName: acc.businessName || 'Unknown',
              status: mapAccountStatus(acc.accountStatus),
              tokenStatus: 'valid',
              pages: [],
              pixels: [],
              profileName: acc.connectionFbUserName || undefined,
              createdAt: acc.lastSyncedAt || new Date().toISOString(),
              updatedAt: acc.lastSyncedAt || new Date().toISOString()
            }
          })
          setAccounts(nextAccounts)
          writeLocalCache(LOCAL_CACHE_KEYS.facebookAccounts, nextAccounts)
          setIsLoading(false)
          setIsRevalidating(false)
          return
        }
      }

      // Rede de segurança: se /api/meta/accounts falhou, ou não retornou nenhuma conta ainda
      // (ex.: Supabase indisponível, ou conta conectada antes dessa migração), cai para a busca
      // antiga ao vivo via cookie — pior do que a fonte principal (só vê a última conta
      // conectada), mas melhor do que a tela ficar vazia.
      const legacyResponse = await fetch('/api/facebook/accounts', {
        credentials: 'include'
      })

      if (legacyResponse.ok) {
        const legacyData = await legacyResponse.json()
        const nextAccounts = legacyData.accounts || []
        setAccounts(nextAccounts)
        writeLocalCache(LOCAL_CACHE_KEYS.facebookAccounts, nextAccounts)
      } else if (legacyResponse.status === 401) {
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
