'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

// Botão de alternância de tema (ver contexts/ThemeContext.tsx). O ícone mostra a AÇÃO do clique
// (lua = "mudar pra escuro", sol = "mudar pra claro"), não o estado atual — é o padrão mais comum
// pra esse tipo de controle. Fica no cabeçalho de cada página (ver PageHeader.tsx), ao lado do
// título — mesmo "bloco superior" onde já mora o botão de menu mobile.
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
