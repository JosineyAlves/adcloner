'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Menu } from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'
import ThemeToggle from './ThemeToggle'

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  backHref?: string
  backLabel?: string
}

// Cabeçalho de página compartilhado por todas as telas (Dashboard, Meta Ads, Integrações e suas
// subpáginas). Envelope em card — mesmo padrão visual (bg-white/dark:bg-gray-800, rounded-lg,
// border) usado nos cards de filtros/período logo abaixo dele — em vez de uma faixa de borda
// solta no topo, para ficar visualmente no mesmo "sistema" dos demais cards da tela. Título
// compacto (text-base, pouco padding vertical) para não ocupar altura desproporcional ao que ele
// carrega: é só identidade da tela, não uma ação.
//
// Fica DENTRO do <main> de cada página (primeiro item da pilha de cards), não numa faixa fixa
// acima dele — assim herda a mesma margem/alinhamento horizontal dos outros cards da tela.
//
// Deliberadamente enxuto: só identidade da tela (título, subtítulo opcional, link de voltar).
// Ações que atuam sobre os dados exibidos (Atualizar, seletor de período) NÃO ficam aqui — elas
// pertencem ao card de conteúdo que os dados/filtros ocupam (ver o card de filtros do Meta Ads e
// o card de período do Dashboard).
//
// Botão de menu (mobile): como é o primeiro elemento renderizado em toda página que tem Sidebar
// (ver components/layout/Sidebar.tsx), é aqui — dentro do fluxo normal do <main>, não flutuando
// por cima do conteúdo — que mora o gatilho que abre o drawer mobile da navegação. Estado
// compartilhado via contexts/SidebarContext.tsx (Sidebar e PageHeader são irmãos no layout de
// cada página, não pai/filho).
//
// Botão de tema (claro/escuro): mesmo raciocínio de lugar — o "bloco superior" de toda página,
// ao lado do título. Ver contexts/ThemeContext.tsx e components/layout/ThemeToggle.tsx.
export default function PageHeader({ title, subtitle, backHref, backLabel }: PageHeaderProps) {
  const { openMobile } = useSidebar()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {backLabel}
        </Link>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={openMobile}
          aria-label="Abrir menu"
          className="md:hidden -ml-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <ThemeToggle />
      </div>
    </div>
  )
}
