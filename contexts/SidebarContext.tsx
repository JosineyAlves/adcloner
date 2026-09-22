'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface SidebarContextType {
  mobileOpen: boolean
  openMobile: () => void
  closeMobile: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

// Estado mínimo (só um boolean) compartilhado entre Sidebar e PageHeader pra controlar o menu
// mobile (drawer). O botão de hambúrguer que abre o drawer mora no PageHeader — primeiro elemento
// de cada página, já dentro do fluxo normal do <main> — em vez de flutuar sobre o conteúdo, pra
// não precisar reservar espaço fixo no topo de cada página só por causa dele. Já a própria Sidebar
// (components/layout/Sidebar.tsx) segue com sua lógica de collapse desktop (localStorage) intacta;
// esse contexto cobre só o comportamento novo de mobile.
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <SidebarContext.Provider
      value={{
        mobileOpen,
        openMobile: () => setMobileOpen(true),
        closeMobile: () => setMobileOpen(false)
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
