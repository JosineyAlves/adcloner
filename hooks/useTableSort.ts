import { useMemo, useState } from 'react'

export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  key: string
  direction: SortDirection
}

/**
 * Ordenação de tabela nos moldes do Gerenciador de Anúncios da Meta: clicar num cabeçalho ordena
 * (crescente pra colunas de texto como "Nome", decrescente — maior primeiro — pra colunas
 * numéricas/métricas), um segundo clique na mesma coluna inverte a direção, e um terceiro clique
 * remove a ordenação, voltando à ordem original (a ordem em que a API retornou).
 *
 * Sempre reordena a LINHA inteira (o objeto completo de `rows`), nunca uma coluna isolada — assim
 * nome/status/orçamento/métricas de uma mesma campanha (ou conjunto/anúncio/conta) continuam
 * sempre juntos; só a posição da linha na tabela muda. Por isso mesmo nada mais depende da ordem
 * (linha de totais, "selecionar todos", seleção por checkbox) precisa ser tocado — todos operam
 * por id ou somam o array inteiro, independente de posição.
 *
 * `resolveValue` permite ordenar por uma coluna que não é um campo direto do objeto (ex.:
 * "Orçamento", que na prática é `daily_budget || lifetime_budget`) sem precisar adicionar um
 * campo novo ao tipo só para isso.
 */
export function useTableSort<T>(
  rows: T[],
  nameKey: string = 'name',
  resolveValue: (row: T, key: string) => any = (row, key) => (row as any)[key]
) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      const firstDirection: SortDirection = key === nameKey ? 'asc' : 'desc'
      const secondDirection: SortDirection = firstDirection === 'asc' ? 'desc' : 'asc'
      if (!prev || prev.key !== key) return { key, direction: firstDirection }
      if (prev.direction === firstDirection) return { key, direction: secondDirection }
      return null
    })
  }

  const sortedRows = useMemo(() => {
    if (!sortConfig) return rows
    const { key, direction } = sortConfig
    const multiplier = direction === 'asc' ? 1 : -1

    return [...rows].sort((a, b) => {
      const aVal = resolveValue(a, key)
      const bVal = resolveValue(b, key)

      if (typeof aVal === 'string' || typeof bVal === 'string') {
        return (aVal ?? '').toString().localeCompare((bVal ?? '').toString(), 'pt-BR') * multiplier
      }

      const aNum = typeof aVal === 'number' ? aVal : parseFloat(aVal)
      const bNum = typeof bVal === 'number' ? bVal : parseFloat(bVal)
      const aValid = !isNaN(aNum)
      const bValid = !isNaN(bNum)
      // Valores ausentes/zerados sempre no fim, independente da direção — igual ao comportamento
      // nativo do Gerenciador de Anúncios.
      if (!aValid && !bValid) return 0
      if (!aValid) return 1
      if (!bValid) return -1
      return (aNum - bNum) * multiplier
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sortConfig])

  return { sortConfig, handleSort, sortedRows }
}
