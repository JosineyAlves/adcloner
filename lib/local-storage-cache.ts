// Cache client-side (localStorage) para dar sensação de "instantâneo" ao recarregar a página.
//
// Problema que isso resolve: o vmetrics não tinha nenhuma persistência client-side — toda vez
// que a página era recarregada, o React remontava do zero e o usuário via telas vazias até
// que a Graph API respondesse de novo (contas, depois campanhas/conjuntos/anúncios).
//
// Estratégia: stale-while-revalidate. Ao montar, hidratamos o estado com o que estiver salvo no
// localStorage (mesmo que "velho") para o usuário ver dados imediatamente, e disparamos uma busca
// nova em paralelo para atualizar em segundo plano. Isso é só uma camada de UX no navegador —
// não substitui um cache de servidor (isso é outro problema, do lado do servidor/serverless).

export interface LocalCacheEntry<T> {
  data: T
  savedAt: number // epoch ms
}

const isBrowser = typeof window !== 'undefined'

export function readLocalCache<T>(key: string, maxAgeMs?: number): LocalCacheEntry<T> | null {
  if (!isBrowser) return null

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null

    const parsed = JSON.parse(raw) as LocalCacheEntry<T>
    if (!parsed || typeof parsed.savedAt !== 'number') return null

    if (maxAgeMs && Date.now() - parsed.savedAt > maxAgeMs) {
      // Não removemos automaticamente: dado "velho" ainda é melhor que tela vazia
      // enquanto a busca em segundo plano não termina. Quem chamar decide o que fazer.
      return parsed
    }

    return parsed
  } catch (error) {
    console.warn(`⚠️ Falha ao ler cache local (${key}):`, error)
    return null
  }
}

export function writeLocalCache<T>(key: string, data: T): void {
  if (!isBrowser) return

  try {
    const entry: LocalCacheEntry<T> = { data, savedAt: Date.now() }
    window.localStorage.setItem(key, JSON.stringify(entry))
  } catch (error) {
    // Pode falhar em modo privado/quota cheia — não é crítico, apenas perdemos o cache
    console.warn(`⚠️ Falha ao salvar cache local (${key}):`, error)
  }
}

export function isCacheFresh(savedAt: number, maxAgeMs: number): boolean {
  return Date.now() - savedAt <= maxAgeMs
}

export const LOCAL_CACHE_KEYS = {
  facebookAccounts: 'vmetrics:facebook-accounts:v1',
  metaBusinessData: 'vmetrics:meta-business-data:v1',
  // Prefixo — a chave real inclui o viewKey (ex.: "vmetrics:column-preferences:v1:meta_business_metrics"),
  // ver hooks/useColumnPreferences.ts. Isso permite mais de uma tela com seletor de colunas própria.
  columnPreferencesPrefix: 'vmetrics:column-preferences:v1:',
  // Período de data (datePreset/customRange) compartilhado entre TODAS as telas com seletor de
  // período (Dashboard Financeiro e Meta Business) — pedido do usuário: selecionar "Últimos 30
  // dias" numa tela deve valer para as outras também, em vez de cada uma guardar seu próprio
  // período independente. Ver app/dashboard/page.tsx e app/meta-business/page.tsx.
  sharedDateFilter: 'vmetrics:shared-date-filter:v1',
} as const

// Quanto tempo o dado salvo é considerado "fresco" antes de forçar um refetch em primeiro plano.
// Mesmo passado esse tempo, o dado salvo ainda é exibido imediatamente (stale) enquanto a
// atualização roda em segundo plano — o usuário nunca vê tela vazia por causa do cache expirado.
export const LOCAL_CACHE_MAX_AGE = {
  facebookAccounts: 30 * 60 * 1000, // 30 min — contas mudam raramente
  metaBusinessData: 10 * 60 * 1000, // 10 min — alinhado ao TTL de campanhas/adsets no server
} as const
