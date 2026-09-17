'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  readLocalCache,
  writeLocalCache,
  LOCAL_CACHE_KEYS
} from '@/lib/local-storage-cache'

/**
 * Persiste a seleção/ordem de colunas (lista de ids de métrica) de uma tela no Supabase, por
 * usuário (via app/api/meta-business/column-preferences, que lê o cookie fb_user_id — ver
 * lib/column-preferences.ts no servidor), com uma camada de cache local (localStorage) para
 * hidratar a tela instantaneamente, no mesmo padrão stale-while-revalidate já usado para os
 * dados do Meta Business (ver lib/local-storage-cache.ts).
 *
 * `viewKey` identifica a tela/tabela (ex.: 'meta_business_metrics'), permitindo reaproveitar a
 * mesma tabela do Supabase para outros seletores de coluna no futuro.
 * `defaultMetricIds` é usado apenas enquanto não há nada salvo (nem local, nem no servidor) —
 * ver lib/metrics-config.ts -> DEFAULT_METRIC_IDS para o padrão "estilo Meta" atual.
 */
export function useColumnPreferences(viewKey: string, defaultMetricIds: string[]) {
  const cacheKey = `${LOCAL_CACHE_KEYS.columnPreferencesPrefix}${viewKey}`

  const [metricIds, setMetricIds] = useState<string[]>(() => {
    const cached = readLocalCache<string[]>(cacheKey)
    return cached?.data && cached.data.length > 0 ? cached.data : defaultMetricIds
  })
  const [isLoaded, setIsLoaded] = useState<boolean>(false)
  const hasFetchedRef = useRef(false)

  // Busca a preferência real do servidor uma vez ao montar (ou quando o viewKey mudar) —
  // sobrescreve o valor hidratado do cache/padrão se o servidor tiver algo salvo.
  useEffect(() => {
    hasFetchedRef.current = false
  }, [viewKey])

  useEffect(() => {
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true

    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch(
          `/api/meta-business/column-preferences?viewKey=${encodeURIComponent(viewKey)}`,
          { credentials: 'include' }
        )
        if (!response.ok) {
          // Antes esse retorno era ignorado em silêncio (inclusive um 401 permanente, já que o
          // cookie que a rota esperava nunca era setado) — agora loga pra ficar visível que a
          // preferência não está vindo do servidor, mesmo que a tela continue funcionando com o
          // cache local/padrão.
          console.error(
            `Erro ao carregar preferências de colunas salvas: HTTP ${response.status}`
          )
          return
        }
        const data = await response.json()
        const saved = data?.metricIds
        if (!cancelled && Array.isArray(saved) && saved.length > 0) {
          setMetricIds(saved)
          writeLocalCache(cacheKey, saved)
        }
      } catch (error) {
        console.error('Erro ao carregar preferências de colunas salvas:', error)
      } finally {
        if (!cancelled) setIsLoaded(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [viewKey, cacheKey])

  const saveMetricIds = useCallback((ids: string[]) => {
    setMetricIds(ids)
    writeLocalCache(cacheKey, ids)

    // fetch() só rejeita em falha de rede — uma resposta HTTP de erro (401, 500...) resolve a
    // promise normalmente, então o .catch sozinho nunca pegava isso: um 401 permanente (cookie
    // que a rota esperava nunca era setado) ficava completamente invisível e a gravação no
    // Supabase nunca acontecia, mesmo com a seleção "funcionando" via cache local.
    fetch('/api/meta-business/column-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ viewKey, metricIds: ids })
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null)
          console.error(
            `Erro ao salvar preferências de colunas: HTTP ${response.status}`,
            body?.error ?? ''
          )
        }
      })
      .catch((error) => {
        console.error('Erro ao salvar preferências de colunas:', error)
      })
  }, [viewKey, cacheKey])

  return { metricIds, saveMetricIds, isLoaded }
}
