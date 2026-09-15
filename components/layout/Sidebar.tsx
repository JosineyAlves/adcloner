'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Link2,
  LogOut
} from 'lucide-react'
import MetaIcon from '@/components/meta-business/icons/MetaIcon'
import toast from 'react-hot-toast'

// Estilo visual inspirado na sidebar da UTMify (fundo escuro, ícone + label, item ativo
// destacado com fundo e texto em azul) — mantém só os itens que já existem no AdCloner, sem
// replicar a estrutura de menu da UTMify (Google, UTMs, Regras, Taxas, Despesas, Assinatura,
// Indique e Ganhe etc.), que não têm equivalente aqui. "Contas Conectadas" virou "Integrações"
// (mesma rota /meta-accounts) para casar com o nome usado pela UTMify pra essa tela.
//
// "Templates" e "Configurações" removidos do menu (set/2026) — nenhuma das duas rotas
// (/templates, /settings) tem uma página implementada; eram links mortos caindo na página de
// erro 404 padrão do Next.js (sem sidebar/padding do projeto). Ver seção 36 do doc do projeto.
// Reintroduzir aqui quando essas telas existirem de fato.
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Meta Business', href: '/meta-business', icon: MetaIcon },
  { name: 'Integrações', href: '/meta-accounts', icon: Link2 },
  { name: 'Contas', href: '/accounts', icon: Users },
]

export default function Sidebar() {
  const pathname = usePathname()

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
    <div className="flex h-full w-52 flex-col bg-[#12141c] border-r border-white/5">
      <div className="flex h-14 items-center px-4 border-b border-white/5">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">AC</span>
          </div>
          <span className="text-base font-bold text-white truncate">
            AdCloner Pro
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-primary-600/15 text-primary-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              <item.icon className="w-5 h-5 mr-2.5 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/5 p-3">
        <button
          onClick={handleLogout}
          className="flex items-center w-full text-left px-3 py-2 text-sm font-medium rounded-lg text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5 mr-2.5 flex-shrink-0" />
          Sair
        </button>
      </div>
    </div>
  )
}