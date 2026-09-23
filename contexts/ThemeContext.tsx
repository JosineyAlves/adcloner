'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'vmetrics:theme'

// Liga/desliga a classe `dark` na tag <html> (tailwind.config.js: darkMode: 'class'). A
// interface inteira já usa variantes dark: extensivamente desde o início (ver app/globals.css —
// body, .card, .input-field, .btn-secondary — e praticamente todo componente da tela), então só
// faltava esse mecanismo pra realmente ligar/desligar; nenhum componente precisou ganhar estilo
// novo por causa disso.
//
// O flash de tema errado (mostrar claro por uma fração de segundo antes de aplicar escuro) é
// evitado por um script inline em app/layout.tsx, que aplica a classe ANTES da hidratação — este
// provider só lê o que já está no <html> (useEffect abaixo) pra manter esse estado em sincronia
// com o resto da árvore (botão em components/layout/ThemeToggle.tsx).
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'dark' : 'light')
  }, [])

  const applyTheme = (next: Theme) => {
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Sem persistência (ex.: modo privado) — a sessão atual ainda reflete a escolha do usuário.
    }
  }

  const toggleTheme = () => {
    applyTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
