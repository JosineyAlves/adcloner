'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { FacebookAccount } from '@/lib/types'
import AccountCard from './AccountCard'
import ConnectFacebookModal from './ConnectFacebookModal'

export default function AccountsSection() {
  const [accounts, setAccounts] = useState<FacebookAccount[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/facebook/accounts', {
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAccounts(data.accounts || [])
        if (data.message) {
          toast.success(data.message)
        }
      } else {
        setError(data.message || 'Erro ao carregar contas')
        setAccounts([])
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
      setError('Erro de conexão. Verifique sua internet.')
      setAccounts([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAccounts()
    setIsRefreshing(false)
  }

  const handleConnectSuccess = () => {
    setShowConnectModal(false)
    fetchAccounts()
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Contas Conectadas
          </h2>
          <div className="flex items-center gap-3">
            <button
              disabled
              className="btn-secondary flex items-center gap-2 opacity-50 cursor-not-allowed"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando...
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="card animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Contas Conectadas
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {accounts.length === 0 
              ? 'Nenhuma conta conectada'
              : `${accounts.length} conta(s) conectada(s)`
            }
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-secondary flex items-center gap-2"
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
          
          <button
            onClick={() => setShowConnectModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Conectar Conta
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                Erro ao carregar contas
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
              <button
                onClick={fetchAccounts}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 mt-2 font-medium"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!error && accounts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-12 h-12 text-gray-400" />
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhuma conta conectada
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Conecte sua conta do Facebook para começar a gerenciar campanhas de anúncios.
          </p>
          
          <button
            onClick={() => setShowConnectModal(true)}
            className="btn-primary flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Conectar Primeira Conta
          </button>
        </motion.div>
      )}

      {/* Accounts Grid */}
      {!error && accounts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onUpdate={fetchAccounts}
            />
          ))}
        </motion.div>
      )}

      {/* Connect Modal */}
      <ConnectFacebookModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
      />
    </div>
  )
} 