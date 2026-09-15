'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Link2,
  LogOut,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'
import MetaIcon from '@/components/meta-business/icons/MetaIcon'
import toast from 'react-hot-toast'

// Sidebar — elemento mais forte da identidade visual do AdCloner Pro: fundo na cor de marca
// (#CEFF00) com texto/ícones em preto para contraste máximo (ver app/globals.css e
// tailwind.config.js para os tokens de design). Suporta collapse (ícone-only, com tooltip)
// persistido em localStorage, sem alterar nenhuma rota existente.
//
// "Templates" e "Configurações" seguem fora do menu (set/2026) — nenhuma das duas rotas tem
// uma página totalmente integrada ao fluxo atual; ver seção 36 do doc do projeto. Reintroduzir
// aqui quando essas telas existirem de fato.
//
// "Contas" (/accounts) segue fora do menu (set/2026) — duplicava a listagem de contas de
// anúncio já disponível em "Integrações". Ver seção 40 do doc do projeto.
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Meta Business', href: '/meta-business', icon: MetaIcon },
  { name: 'Integrações', href: '/meta-accounts', icon: Link2 },
]

const COLLAPSE_STORAGE_KEY = 'adcloner:sidebar-collapsed'

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Lê a preferência salva só no client (evita mismatch de hidratação do Next).
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1')
    } catch {
      // localStorage indisponível (ex.: modo privado) — segue expandida por padrão.
    }
    setHydrated(true)
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? '1' : '0')
      } catch {
        // Sem persistência — a sessão atual ainda reflete a escolha do usuário.
      }
      return next
    })
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        toast.success('Logout realizado com sucesso')
        window.location.href = '/login'
      } else {
        toast.error('Erro ao fazer logout')
      }
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Erro ao fazer logout')
    }
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 72 : 224 }}
      transition={{ duration: hydrated ? 0.2 : 0, ease: 'easeInOut' }}
      className="relative flex h-full flex-col bg-brand-500 flex-shrink-0 overflow-hidden"
    >
      {/* Logo/Brand — logo.svg (ícone + wordmark) expandida, icon-logo.svg (só o ícone,
          já com o quadrado na cor de marca) recolhida. Arquivos fornecidos pelo usuário,
          servidos de /public. */}
      <div className={`flex h-14 items-center border-b border-black/10 ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
        {collapsed ? (
          <img src="/icon-logo.svg" alt="AdCloner Pro" className="w-8 h-8 flex-shrink-0" />
        ) : (
          <img src="/logo.svg" alt="AdCloner Pro" className="h-6 w-auto max-w-[160px]" />
        )}
      </div>

      {/* Navegação principal */}
      <nav className="flex-1 space-y-1 px-2.5 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={`group relative flex items-center rounded-ds-md text-sm font-medium transition-colors duration-150 ${
                collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-black text-brand-500'
                  : 'text-black/70 hover:bg-black/10 hover:text-black'
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${collapsed ? '' : 'mr-2.5'}`} />
              {!collapsed && <span className="truncate">{item.name}</span>}

              {/* Tooltip no modo collapsed */}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-ds-sm bg-black px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50">
                  {item.name}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Área inferior: collapse + perfil/logout */}
      <div className="border-t border-black/10 p-2.5 space-y-1">
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className={`group relative flex items-center w-full text-left rounded-ds-md text-sm font-medium text-black/70 hover:bg-black/10 hover:text-black transition-colors duration-150 ${
            collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
          }`}
        >
          {collapsed ? (
            <ChevronsRight className="w-5 h-5 flex-shrink-0" />
          ) : (
            <>
              <ChevronsLeft className="w-5 h-5 mr-2.5 flex-shrink-0" />
              <span className="truncate">Recolher</span>
            </>
          )}
        </button>

        <button
          onClick={handleLogout}
          title={collapsed ? 'Sair' : undefined}
          className={`group relative flex items-center w-full text-left rounded-ds-md text-sm font-medium text-black/70 hover:bg-black/10 hover:text-black transition-colors duration-150 ${
            collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
          }`}
        >
          <LogOut className={`w-5 h-5 flex-shrink-0 ${collapsed ? '' : 'mr-2.5'}`} />
          {!collapsed && 'Sair'}

          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-ds-sm bg-black px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50">
              Sair
            </span>
          )}
        </button>
      </div>
    </motion.div>
  )
}
