'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  CreditCard, 
  Download,
  Trash2,
  Facebook,
  Settings as SettingsIcon
} from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [connectedAccountsCount, setConnectedAccountsCount] = useState(0)
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: User },
    { id: 'integrations', name: 'Integrações', icon: Facebook },
    { id: 'notifications', name: 'Notificações', icon: Bell },
    { id: 'appearance', name: 'Aparência', icon: Palette },
    { id: 'security', name: 'Segurança', icon: Shield },
    { id: 'billing', name: 'Cobrança', icon: CreditCard },
  ]

  // Buscar contas conectadas
  const fetchConnectedAccounts = async () => {
    try {
      setIsLoadingAccounts(true)
      const response = await fetch('/api/facebook/accounts', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setConnectedAccountsCount(data.accounts?.length || 0)
      } else {
        setConnectedAccountsCount(0)
      }
    } catch (error) {
      console.error('Erro ao buscar contas:', error)
      setConnectedAccountsCount(0)
    } finally {
      setIsLoadingAccounts(false)
    }
  }

  useEffect(() => {
    fetchConnectedAccounts()
  }, [])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Configurações
            </h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            {/* Tabs */}
            <div className="flex space-x-1 mb-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Informações do Perfil
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome completo
                      </label>
                      <input
                        type="text"
                        defaultValue="João Silva"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        defaultValue="joao@exemplo.com"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Empresa
                      </label>
                      <input
                        type="text"
                        defaultValue="Minha Empresa"
                        className="input-field"
                      />
                    </div>
                    <div className="pt-4">
                      <button className="btn-primary">
                        Salvar Alterações
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'integrations' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="card p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Integrações
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                            <Facebook className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              Facebook Ads
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {connectedAccountsCount} conta(s) conectada(s)
                            </p>
                          </div>
                        </div>
                        <button className="btn-secondary text-sm py-2 px-4">
                          Gerenciar
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Notificações
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          Notificações por email
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Receber notificações sobre clonagens e erros
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications}
                          onChange={(e) => setNotifications(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'appearance' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Aparência
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          Modo escuro
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Alternar entre tema claro e escuro
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={darkMode}
                          onChange={(e) => setDarkMode(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Segurança
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Senha atual
                      </label>
                      <input
                        type="password"
                        className="input-field"
                        placeholder="Digite sua senha atual"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nova senha
                      </label>
                      <input
                        type="password"
                        className="input-field"
                        placeholder="Digite a nova senha"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirmar nova senha
                      </label>
                      <input
                        type="password"
                        className="input-field"
                        placeholder="Confirme a nova senha"
                      />
                    </div>
                    <div className="pt-4">
                      <button className="btn-primary">
                        Alterar Senha
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'billing' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="card p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Plano Atual
                    </h2>
                    <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Plano Pro
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            $29/mês • Ativo até 15 de Janeiro, 2024
                          </p>
                        </div>
                        <button className="btn-secondary">
                          Alterar Plano
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="card p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      Histórico de Faturas
                    </h2>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Dezembro 2023
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Plano Pro
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-900 dark:text-white font-medium">
                            $29.00
                          </span>
                          <button className="text-primary-600 hover:text-primary-700 text-sm">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
} 