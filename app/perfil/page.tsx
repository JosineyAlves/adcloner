'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Mail, User as UserIcon, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import Sidebar from '@/components/layout/Sidebar'
import PageHeader from '@/components/layout/PageHeader'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'

// Página "Minha Conta" — dados de acesso ao vmetrics (não confundir com "Integrações", que é a
// conexão de PERFIS DO FACEBOOK/Meta pro produto ler/gerenciar campanhas). Deliberadamente enxuta:
// nome de exibição e troca de senha, sem tabela nova no Supabase — os dois usam recursos nativos
// do Supabase Auth (auth.users.user_metadata via supabase.auth.updateUser), sem precisar de RLS
// própria nem de bucket de storage. Email fica só leitura por enquanto (trocar de email exige o
// fluxo de confirmação por link do próprio Supabase — fora do escopo desta primeira versão).
export default function PerfilPage() {
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || '')
        const meta = user.user_metadata as { full_name?: string } | null
        setFullName(meta?.full_name || '')
      }
      setLoading(false)
    })
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() }
      })

      if (error) {
        toast.error('Não foi possível salvar o nome.')
        return
      }

      toast.success('Nome atualizado!')
      // A Sidebar já leu o usuário antes dessa mudança — recarrega pra ela refletir o novo nome
      // sem precisar levantar esse estado pra um contexto global só por causa disso.
      window.location.reload()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Não foi possível salvar o nome.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 6) {
      toast.error('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.')
      return
    }

    setSavingPassword(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) {
        toast.error(
          error.message.includes('different from the old password')
            ? 'A nova senha precisa ser diferente da atual.'
            : 'Não foi possível trocar a senha.'
        )
        return
      }

      toast.success('Senha alterada com sucesso!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error('Não foi possível trocar a senha.')
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pt-3 px-6 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <PageHeader title="Minha Conta" />

            <div className="card p-6 flex items-center gap-4">
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-lg font-semibold text-black">
                {getInitials(fullName || email)}
              </span>
              <div className="min-w-0">
                <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                  {fullName || 'Sem nome definido'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <form onSubmit={handleSaveProfile} className="card p-6 flex flex-col h-full">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Dados da conta</h2>

              <div className="space-y-4 flex-1">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome completo
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome"
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="input-field pl-10 opacity-60 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-2 mt-4 self-start">
                {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar nome
              </button>
            </form>

            <form onSubmit={handleChangePassword} className="card p-6 flex flex-col h-full">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Alterar senha</h2>

              <div className="space-y-4 flex-1">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    placeholder="••••••••"
                    className="input-field pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    placeholder="••••••••"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              </div>

              <button
                type="submit"
                disabled={savingPassword || !newPassword || !confirmPassword}
                className="btn-primary flex items-center gap-2 mt-4 self-start"
              >
                {savingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                Alterar senha
              </button>
            </form>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}
