'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Copy,
  Settings,
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
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Meta Business', href: '/meta-business', icon: MetaIcon },
  { name: 'Integrações', href: '/meta-accounts', icon: Link2 },
  { name: 'Templates', href: '/templates', icon: Copy },
  { name: 'Contas', href: '/accounts', icon: Users },
  { name: 'Configurações', href: '/settings', icon: Settings },
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
    <div className="flex h-full w-64 flex-col bg-[#12141c] border-r border-white/5">
      <div className="flex h-16 items-center px-6 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">AC</span>
          </div>
          <span className="text-xl font-bold text-white">
            AdCloner Pro
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
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
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/5 p-4">
        <button
          onClick={handleLogout}
          className="flex items-center w-full text-left px-3 py-2 text-sm font-medium rounded-lg text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </button>
      </div>
    </div>
  )
}