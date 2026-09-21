'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { readLocalCache, writeLocalCache, LOCAL_CACHE_KEYS } from '@/lib/local-storage-cache'

const MIN_WIDTH = 140
const MAX_WIDTH = 520
const DEFAULT_WIDTH = 240

/**
 * Permite redimensionar (arrastar) a largura de uma coluna fixa (sticky) da tabela — pedido do
 * usuário para a coluna "Nome" (Campanha/Conjunto/Anúncio) das 3 tabelas do Meta Ads Manager.
 * A largura é só uma preferência visual por navegador: persiste em localStorage (mesmo padrão de
 * cache local usado no restante do app — ver lib/local-storage-cache.ts), sem ida ao servidor —
 * diferente de useColumnPreferences.ts (que sincroniza a seleção/ordem de métricas no Supabase).
 *
 * `storageKey` identifica a coluna/tabela (ex.: "campaigns:name"), permitindo larguras
 * independentes por tabela.
 */
export function useColumnResize(storageKey: string, defaultWidth: number = DEFAULT_WIDTH) {
  const cacheKey = `${LOCAL_CACHE_KEYS.nameColumnWidthPrefix}${storageKey}`

  const [width, setWidth] = useState<number>(defaultWidth)
  const [isResizing, setIsResizing] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(defaultWidth)

  // Hidrata a largura salva só no efeito (após montar no cliente) — evita mismatch de SSR.
  useEffect(() => {
    const cached = readLocalCache<number>(cacheKey)
    if (typeof cached?.data === 'number' && cached.data >= MIN_WIDTH && cached.data <= MAX_WIDTH) {
      setWidth(cached.data)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const delta = e.clientX - startXRef.current
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta))
    setWidth(newWidth)
  }, [])

  const handleMouseUp = useCallback(() => {
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    setIsResizing(false)

    setWidth((current) => {
      writeLocalCache(cacheKey, current)
      return current
    })
  }, [handleMouseMove, cacheKey])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    startXRef.current = e.clientX
    startWidthRef.current = width
    setIsResizing(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [width, handleMouseMove, handleMouseUp])

  // Limpa os listeners globais se o componente desmontar no meio de um arraste (ex.: troca de aba).
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  return { width, isResizing, handleMouseDown }
}
