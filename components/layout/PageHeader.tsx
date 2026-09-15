'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  backHref?: string
  backLabel?: string
}

// Cabeçalho de página compartilhado por todas as telas (Dashboard, Meta Ads, Integrações e suas
// subpáginas) — antes cada uma desenhava o próprio <header> na mão, o que gerou a inconsistência
// de o Meta Ads não ter cabeçalho nenhum enquanto as outras tinham. Segue o mesmo padrão de
// layout que já existia (border-b, px-6 py-4, h1 text-2xl font-bold), sem preenchimento de fundo
// próprio — ele "flutua" sobre o bg-gray-50/dark:bg-gray-900 da página.
//
// Deliberadamente enxuto: só identidade da tela (título, subtítulo opcional, link de voltar).
// Ações que atuam sobre os dados exibidos (Atualizar, seletor de período) NÃO ficam aqui — elas
// pertencem ao card de conteúdo que os dados/filtros ocupam (ver o card de filtros do Meta Ads e
// o card de período do Dashboard), seguindo o padrão da referência da UTMify: o cabeçalho da
// página é só "onde eu estou", as ferramentas de dados vivem junto dos dados que elas afetam.
export default function PageHeader({ title, subtitle, backHref, backLabel }: PageHeaderProps) {
  return (
    <header className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>
      )}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{title}</h1>
      {subtitle && (
        <p className="text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      )}
    </header>
  )
}
