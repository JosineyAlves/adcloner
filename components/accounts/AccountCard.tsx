'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Facebook, 
  Building2, 
  Globe, 
  Eye, 
  EyeOff, 
  Settings, 
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react'
import { FacebookAccount } from '@/lib/types'
import { toast } from 'react-hot-toast'

interface AccountCardProps {
  account: FacebookAccount
  onUpdate: () => void
}

export default function AccountCard({ account, onUpdate }: AccountCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const getStatusIcon = () => {
    switch (account.status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'disabled':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = () => {
    switch (account.status) {
      case 'active':
        return 'Ativa'
      case 'disabled':
        return 'Desabilitada'
      case 'pending':
        return 'Pendente'
      default:
        return 'Desconhecido'
    }
  }

  const getStatusColor = () => {
    switch (account.status) {
      case 'active':
        return 'text-green-600 dark:text-green-400'
      case 'disabled':
        return 'text-red-600 dark:text-red-400'
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Tem certeza que deseja desconectar esta conta?')) {
      return
    }

    setIsLoading(true)
    try {
      // Em produção, você faria uma chamada para a API para desconectar
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Conta desconectada com sucesso!')
      onUpdate()
    } catch (error) {
      console.error('Error disconnecting account:', error)
      toast.error('Erro ao desconectar conta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <Facebook className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {account.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {account.id}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Business Manager Info */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Building2 className="w-4 h-4" />
          <span>{account.businessManagerName}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Globe className="w-4 h-4" />
          <span>ID: {account.businessManagerId}</span>
        </div>
      </div>

      {/* Token Status */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${
          account.tokenStatus === 'valid' 
            ? 'bg-green-500' 
            : 'bg-red-500'
        }`} />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Token {account.tokenStatus === 'valid' ? 'válido' : 'inválido'}
        </span>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4"
        >
          {/* Pages */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Páginas ({account.pages.length})
            </h4>
            {account.pages.length > 0 ? (
              <div className="space-y-2">
                {account.pages.map((page) => (
                  <div
                    key={page.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {page.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {page.category}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhuma página encontrada
              </p>
            )}
          </div>

          {/* Pixels */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Pixels ({account.pixels.length})
            </h4>
            {account.pixels.length > 0 ? (
              <div className="space-y-2">
                {account.pixels.map((pixel) => (
                  <div
                    key={pixel.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {pixel.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {pixel.code}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhum pixel encontrado
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={(e) => {
                e.stopPropagation()
                // Implementar configurações
                toast('Configurações em desenvolvimento', {
                  icon: 'ℹ️'
                })
              }}
              className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm"
            >
              <Settings className="w-4 h-4" />
              Configurar
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDisconnect()
              }}
              disabled={isLoading}
              className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Desconectar
            </button>
          </div>
        </motion.div>
      )}

      {/* Toggle Button */}
      <div className="flex items-center justify-center pt-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          {isExpanded ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </motion.div>
  )
} 