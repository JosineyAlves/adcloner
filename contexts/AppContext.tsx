'use client'

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
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
  // true só depois que a lista de contas foi (re)confirmada no servidor NESTA navegação/carga —
  // enquanto for false, `accounts` pode ser só o que estava em localStorage ou a lista da tela
  // anterior (ex.: ainda com contas que acabaram de ser desabilitadas em Integrações). As telas
  // que buscam dados na Meta esperam isso virar true antes de disparar as chamadas.
  isFresh: boolean
  refreshAccounts: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

function sameAccountList(a: FacebookAccount[], b: FacebookAccount[]): boolean {
  return (
    a.length === b.length &&
    a.every((acc, i) => acc.id === b[i].id && acc.name === b[i].name && acc.status === b[i].status)
  )
}

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
  const [isFresh, setIsFresh] = useState<boolean>(false)

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
      // enabledOnly=true: exclui contas desabilitadas (toggle em Integrações) — Meta Business e
      // Dashboard não devem buscar nem contabilizar dados de uma conta que o usuário desligou.
      const response = await fetch('/api/meta/accounts?enabledOnly=true', {
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
              // lastSyncedAt não existe mais (era só do pipeline de sync removido, nunca
              // populada por nada hoje) — createdAt/updatedAt aqui nunca foram lidos em nenhuma
              // tela mesmo antes disso, mas mantidos por ora só pra não mudar o shape de
              // FacebookAccount fora do escopo desta limpeza.
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          })
          // Mantém a mesma referência se nada mudou, pra não reexecutar efeitos das telas
          // (que dependem de `accounts`) a cada revalidação.
          setAccounts((prev) => (sameAccountList(prev, nextAccounts) ? prev : nextAccounts))
          writeLocalCache(LOCAL_CACHE_KEYS.facebookAccounts, nextAccounts)
          setIsLoading(false)
          setIsRevalidating(false)
          setIsFresh(true)
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
      // Mesmo se a busca falhou, libera as telas (elas seguem com o que já tinham) em vez de
      // ficarem esperando pra sempre.
      setIsFresh(true)
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

  // Este provider vive no layout raiz: NÃO remonta ao navegar entre telas, então a busca acima só
  // acontecia na carga inicial (F5). Quem habilitava/desabilitava contas em Integrações e voltava
  // pra Meta Ads continuava vendo a lista antiga até recarregar a página — às vezes mais de uma
  // vez, porque o F5 hidrata o localStorage ANTIGO primeiro e só depois revalida. Agora cada troca
  // de rota revalida a lista (consulta leve no Supabase, não chama a Meta) e marca isFresh=false
  // até a resposta chegar.
  const pathname = usePathname()
  const lastPathnameRef = useRef<string | null>(null)
  useEffect(() => {
    if (lastPathnameRef.current === null) {
      lastPathnameRef.current = pathname
      return
    }
    if (lastPathnameRef.current === pathname) return
    lastPathnameRef.current = pathname
    // Telas públicas não têm sessão: a busca devolveria 401 e redirecionaria pro login.
    if (/^\/(login|register|auth)(\/|$)/.test(pathname || '')) return
    setIsFresh(false)
    fetchAccounts(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <AppContext.Provider value={{
      accounts,
      isLoading,
      isRevalidating,
      isFresh,
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
