'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { readLocalCache, writeLocalCache, LOCAL_CACHE_KEYS } from '@/lib/local-storage-cache'

export const RESIZE_MIN_WIDTH = 90
export const RESIZE_MAX_WIDTH = 520

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

// Canvas offscreen reaproveitado só pra medir texto (Canvas2D.measureText) — muito mais barato do
// que montar/desmontar um elemento invisível no DOM pra descobrir a largura real de uma string.
// É uma estimativa (não usa a fonte computada de cada célula, só uma aproximação fixa), suficiente
// pro "ajustar ao conteúdo": o usuário sempre pode arrastar manualmente depois se sobrar/faltar.
let measureCanvas: HTMLCanvasElement | null = null
function getMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null
  if (!measureCanvas) measureCanvas = document.createElement('canvas')
  return measureCanvas.getContext('2d')
}

const DEFAULT_FONT = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

function measureTextWidth(text: string, font: string = DEFAULT_FONT): number {
  const ctx = getMeasureContext()
  if (!ctx) return text.length * 7 // fallback grosseiro (SSR ou canvas indisponível)
  ctx.font = font
  return ctx.measureText(text).width
}

/**
 * Gerencia a largura ajustável (arrastar) de várias colunas de uma mesma tabela — usado nas 3
 * tabelas do Meta Ads Manager (Campanhas/Conjuntos/Anúncios), tanto na coluna fixa "Nome" quanto
 * nas colunas de Orçamento e de métrica. Cada coluna é identificada por um `columnId` (ex.: 'name',
 * 'budget', ou o id da métrica) e tem sua largura persistida separadamente em localStorage, sob
 * `tableKey` (ex.: 'campaigns') — mesmo padrão stale-while-revalidate do resto do app (ver
 * lib/local-storage-cache.ts), sem ida ao servidor: é só uma preferência visual por navegador.
 *
 * Além de arrastar, `autoFit` calcula a largura ideal a partir dos valores atualmente visíveis
 * naquela coluna (cabeçalho + células), pra um "ajustar ao conteúdo" pontual (duplo-clique na
 * alça — ver ColumnResizeHandle.tsx) que não recalcula sozinho a cada atualização de dados.
 */
export function useResizableColumns(tableKey: string, defaultWidth = 200) {
  const [widths, setWidths] = useState<Record<string, number>>({})
  const [resizingId, setResizingId] = useState<string | null>(null)
  const hydratedRef = useRef<Set<string>>(new Set())
  const dragRef = useRef<{ id: string; startX: number; startWidth: number } | null>(null)

  const cacheKeyFor = useCallback(
    (id: string) => `${LOCAL_CACHE_KEYS.nameColumnWidthPrefix}${tableKey}:${id}`,
    [tableKey]
  )

  const persist = useCallback((id: string, value: number) => {
    writeLocalCache(cacheKeyFor(id), value)
  }, [cacheKeyFor])

  // Hidrata a largura salva de uma coluna, uma única vez por id. Chamado durante a renderização
  // (a partir de getWidth), mas o setState — se houver algo salvo — é adiado pra depois do render
  // via microtask, pra não disparar "setState durante render". Como cada id só hidrata uma vez
  // (hydratedRef), isso nunca entra em loop.
  const ensureHydrated = useCallback((id: string) => {
    if (hydratedRef.current.has(id)) return
    hydratedRef.current.add(id)
    const cached = readLocalCache<number>(cacheKeyFor(id))
    if (typeof cached?.data === 'number') {
      const clamped = clamp(cached.data, RESIZE_MIN_WIDTH, RESIZE_MAX_WIDTH)
      Promise.resolve().then(() => {
        setWidths((prev) => (prev[id] !== undefined ? prev : { ...prev, [id]: clamped }))
      })
    }
  }, [cacheKeyFor])

  const getWidth = useCallback((id: string, fallbackWidth: number = defaultWidth) => {
    ensureHydrated(id)
    return widths[id] ?? fallbackWidth
  }, [widths, ensureHydrated, defaultWidth])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const delta = e.clientX - drag.startX
    const newWidth = clamp(drag.startWidth + delta, RESIZE_MIN_WIDTH, RESIZE_MAX_WIDTH)
    setWidths((prev) => ({ ...prev, [drag.id]: newWidth }))
  }, [])

  const handleMouseUp = useCallback(() => {
    const drag = dragRef.current
    dragRef.current = null
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    setResizingId(null)
    if (drag) {
      setWidths((prev) => {
        const value = prev[drag.id]
        if (typeof value === 'number') persist(drag.id, value)
        return prev
      })
    }
  }, [handleMouseMove, persist])

  const startResize = useCallback((id: string, currentWidth: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = { id, startX: e.clientX, startWidth: currentWidth }
    setResizingId(id)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove, handleMouseUp])

  const autoFit = useCallback((
    id: string,
    values: string[],
    options?: { padding?: number; min?: number; max?: number; font?: string }
  ) => {
    const padding = options?.padding ?? 40
    const min = options?.min ?? RESIZE_MIN_WIDTH
    const max = options?.max ?? RESIZE_MAX_WIDTH
    const longest = values.reduce((acc, v) => Math.max(acc, measureTextWidth(v, options?.font)), 0)
    const next = clamp(Math.ceil(longest + padding), min, max)
    setWidths((prev) => ({ ...prev, [id]: next }))
    persist(id, next)
  }, [persist])

  // Limpa os listeners globais se o componente desmontar no meio de um arraste (ex.: troca de aba).
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  return { getWidth, startResize, autoFit, resizingId }
}
