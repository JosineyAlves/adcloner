'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Facebook,
  Link2,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { readLocalCache, writeLocalCache, LOCAL_CACHE_KEYS } from '@/lib/local-storage-cache'
import { useSidebar } from '@/contexts/SidebarContext'

// Sidebar — elemento mais forte da identidade visual do vmetrics: fundo na cor de marca
// (#CEFF00) com texto/ícones em preto para contraste máximo (ver app/globals.css e
// tailwind.config.js para os tokens de design). Suporta collapse (ícone-only, com tooltip)
// persistido em localStorage, sem alterar nenhuma rota existente.
//
// Mobile (< md): a versão fixa/colapsável abaixo não cabe numa tela de celular — vira um
// drawer off-canvas (escondida fora da tela, entra por cima do conteúdo quando aberta), sem o
// conceito de "collapse" (não faz sentido pra um menu que já começa escondido). O botão que abre
// o drawer mora no PageHeader (components/layout/PageHeader.tsx), e o estado aberto/fechado é
// compartilhado via contexts/SidebarContext.tsx — Sidebar e PageHeader são irmãos no layout de
// cada página, não pai/filho.
//
// "Templates" e "Configurações" seguem fora do menu (set/2026) — nenhuma das duas rotas tem
// uma página totalmente integrada ao fluxo atual; ver seção 36 do doc do projeto. Reintroduzir
// aqui quando essas telas existirem de fato.
//
// "Contas" (/accounts) segue fora do menu (set/2026) — duplicava a listagem de contas de
// anúncio já disponível em "Integrações". Ver seção 40 do doc do projeto.
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Meta Ads', href: '/meta-ads-manager', icon: Facebook },
  { name: 'Integrações', href: '/meta-accounts', icon: Link2 },
]

const COLLAPSE_STORAGE_KEY = 'vmetrics:sidebar-collapsed'

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const { mobileOpen, closeMobile } = useSidebar()

  // Lê a preferência salva só no client (evita mismatch de hidratação do Next).
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1')
    } catch {
      // localStorage indisponível (ex.: modo privado) — segue expandida por padrão.
    }
    setHydrated(true)
  }, [])

  // Fecha o drawer mobile automaticamente ao trocar de rota — evita ter que fechar manualmente
  // depois de tocar num item do menu.
  useEffect(() => {
    closeMobile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Nome/email de quem está logado, pro link "Minha Conta" abaixo (ver app/perfil/page.tsx) —
  // vem do auth.users do Supabase (sem tabela própria: usa user_metadata.full_name, o mesmo
  // campo que a página de perfil atualiza via supabase.auth.updateUser).
  //
  // Hidratado a partir do cache local (não de `null`): sem layout compartilhado por rota, a
  // Sidebar inteira é desmontada e remontada a cada navegação entre páginas — sem isso, esse
  // link sumia por um instante a cada troca de aba (o fetch no Supabase Auth é assíncrono, então
  // toda remontagem passava por um frame com `account` nulo antes de reaparecer). Com o cache, o
  // primeiro render já mostra o último nome conhecido; a busca abaixo só atualiza a tela (e o
  // cache) se algo tiver mudado de verdade.
  const [account, setAccount] = useState<{ name: string; email: string } | null>(() => {
    const cached = readLocalCache<{ name: string; email: string }>(LOCAL_CACHE_KEYS.sidebarAccount)
    return cached?.data ?? null
  })

  useEffect(() => {
    let active = true
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active || !user) return
      const fullName = (user.user_metadata as { full_name?: string } | null)?.full_name?.trim()
      const next = { name: fullName || user.email || 'Minha conta', email: user.email || '' }
      setAccount(next)
      writeLocalCache(LOCAL_CACHE_KEYS.sidebarAccount, next)
    })
    return () => {
      active = false
    }
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

  // Conteúdo de navegação compartilhado entre a sidebar desktop (colapsável) e o drawer mobile
  // (sempre "expandida", já que mobile não tem o conceito de collapse). `onNavigate` — quando
  // passado — é chamado ao clicar num link/botão de navegação (fecha o drawer no mobile).
  // overflow-y-auto só no drawer mobile (quando há onNavigate): no desktop, aplicar overflow
  // em só um eixo (overflow-y) faz o navegador forçar overflow-x pra "auto" também (é assim que
  // a spec de CSS Overflow resolve visible + não-visible combinados) — e isso criava uma barra de
  // rolagem horizontal indesejada na sidebar recolhida, porque os tooltips de hover (abaixo,
  // "absolute left-full", sempre no DOM mesmo com opacity-0) passam a contar como conteúdo que
  // "estoura" a largura da nav. O drawer mobile nunca renderiza esses tooltips (collapsedStyle
  // sempre false lá), então não tem esse risco — só ele precisa do scroll vertical mesmo.
  const renderNavLinks = (collapsedStyle: boolean, onNavigate?: () => void) => (
    <nav className={`flex-1 space-y-1 px-2.5 py-4 ${onNavigate ? 'overflow-y-auto' : ''}`}>
      {navigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            title={collapsedStyle ? item.name : undefined}
            className={`group relative flex items-center rounded-ds-md text-sm font-medium transition-colors duration-150 ${
              collapsedStyle ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
            } ${
              isActive
                ? 'bg-black/10 text-black font-semibold'
                : 'text-black/70 hover:bg-black/10 hover:text-black'
            }`}
          >
            <item.icon className={`w-5 h-5 flex-shrink-0 ${collapsedStyle ? '' : 'mr-2.5'}`} />
            {!collapsedStyle && <span className="truncate">{item.name}</span>}

            {/* Tooltip no modo collapsed (só existe na versão desktop) */}
            {collapsedStyle && (
              <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-ds-sm bg-black px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50">
                {item.name}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )

  const renderAccountLink = (collapsedStyle: boolean, onNavigate?: () => void) =>
    account && (
      <Link
        href="/perfil"
        onClick={onNavigate}
        title={collapsedStyle ? 'Minha Conta' : undefined}
        className={`group relative flex items-center rounded-ds-md text-sm font-medium text-black/70 hover:bg-black/10 hover:text-black transition-colors duration-150 ${
          collapsedStyle ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
        }`}
      >
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-black/10 text-[11px] font-semibold text-black">
          {getInitials(account.name)}
        </span>
        {!collapsedStyle && (
          <span className="ml-2.5 min-w-0 flex-1 truncate">
            <span className="block truncate text-sm leading-tight">{account.name}</span>
            <span className="block truncate text-[11px] font-normal text-black/50 leading-tight">Minha conta</span>
          </span>
        )}

        {collapsedStyle && (
          <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-ds-sm bg-black px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50">
            Minha Conta
          </span>
        )}
      </Link>
    )

  const renderLogoutButton = (collapsedStyle: boolean) => (
    <button
      onClick={handleLogout}
      title={collapsedStyle ? 'Sair' : undefined}
      className={`group relative flex items-center w-full text-left rounded-ds-md text-sm font-medium text-black/70 hover:bg-black/10 hover:text-black transition-colors duration-150 ${
        collapsedStyle ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
      }`}
    >
      <LogOut className={`w-5 h-5 flex-shrink-0 ${collapsedStyle ? '' : 'mr-2.5'}`} />
      {!collapsedStyle && 'Sair'}

      {collapsedStyle && (
        <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-ds-sm bg-black px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50">
          Sair
        </span>
      )}
    </button>
  )

  return (
    <>
      {/* Drawer mobile — escondido fora da tela (translate-x-full) até mobileOpen virar true.
          Sempre no estilo "expandido" (sem collapse) e com espaço extra de toque (w-64) em
          relação aos 176px da versão desktop expandida. */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            onClick={closeMobile}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{ x: mobileOpen ? 0 : '-100%' }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="md:hidden fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-500 shadow-xl"
        aria-hidden={!mobileOpen}
      >
        <div className="flex h-14 items-center justify-between border-b border-black/10 px-4">
          <img src="/logo.svg" alt="vmetrics" className="h-6 w-auto max-w-[140px]" />
          <button
            onClick={closeMobile}
            aria-label="Fechar menu"
            className="flex h-8 w-8 items-center justify-center rounded-ds-md text-black/70 hover:bg-black/10 hover:text-black transition-colors duration-150"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {renderNavLinks(false, closeMobile)}

        <div className="border-t border-black/10 p-2.5 space-y-1">
          {renderAccountLink(false, closeMobile)}
          {renderLogoutButton(false)}
        </div>
      </motion.div>

      {/* Sidebar desktop — persistente, colapsável, comportamento inalterado. Escondida abaixo
          de md (o drawer acima assume nesse breakpoint). */}
      <motion.div
        initial={false}
        animate={{ width: collapsed ? 64 : 176 }}
        transition={{ duration: hydrated ? 0.2 : 0, ease: 'easeInOut' }}
        className="relative hidden md:flex h-full flex-col bg-brand-500 flex-shrink-0 overflow-hidden"
      >
        {/* Logo/Brand — logo.svg (ícone + wordmark) expandida, icon-logo.svg (só o ícone,
            já com o quadrado na cor de marca) recolhida. Arquivos fornecidos pelo usuário,
            servidos de /public. */}
        <div className={`flex h-14 items-center border-b border-black/10 ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
          {collapsed ? (
            <img src="/icon-logo.svg" alt="vmetrics" className="w-8 h-8 flex-shrink-0" />
          ) : (
            <img src="/logo.svg" alt="vmetrics" className="h-6 w-auto max-w-[160px]" />
          )}
        </div>

        {renderNavLinks(collapsed)}

        {/* Área inferior: perfil + collapse + logout */}
        <div className="border-t border-black/10 p-2.5 space-y-1">
          {renderAccountLink(collapsed)}

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

          {renderLogoutButton(collapsed)}
        </div>
      </motion.div>
    </>
  )
}
