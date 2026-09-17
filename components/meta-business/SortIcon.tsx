'use client'

import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

interface SortIconProps {
  active: boolean
  direction?: 'asc' | 'desc'
}

// Ícone de ordenação estilo Gerenciador de Anúncios: seta cheia (pra cima = crescente, pra baixo
// = decrescente) só na coluna atualmente ordenada; nas demais colunas fica um ícone neutro,
// visível só quando o mouse passa sobre aquele cabeçalho (via `group-hover`, aplicado no <th>
// pai que precisa ter a classe `group`).
export default function SortIcon({ active, direction }: SortIconProps) {
  if (active && direction === 'asc') {
    return <ChevronUp className="w-3.5 h-3.5 inline-block ml-1 shrink-0" />
  }
  if (active && direction === 'desc') {
    return <ChevronDown className="w-3.5 h-3.5 inline-block ml-1 shrink-0" />
  }
  return (
    <ChevronsUpDown className="w-3.5 h-3.5 inline-block ml-1 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" />
  )
}
