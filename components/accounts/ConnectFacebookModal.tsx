'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Facebook, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ConnectFacebookModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (newAccounts: any[]) => void
}

export default function ConnectFacebookModal({ isOpen, onClose, onSuccess }: ConnectFacebookModalProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleConnectFacebook = async () => {
    setIsConnecting(true)
    setConnectionStatus('connecting')
    setErrorMessage('')

    try {
      console.log('🔗 Iniciando conexão com Facebook...')
      
      // Usar a API do servidor para gerar URL correta
      const response = await fetch('/api/auth/facebook')
      const data = await response.json()
      
      console.log('📋 Resposta da API:', data)
      
      if (!data.authUrl) {
        throw new Error('Erro ao gerar URL de autenticação')
      }
      
      // URL do popup do Facebook
      const popupUrl = data.authUrl + '&display=popup'
      console.log('🔗 URL do popup:', popupUrl)

      // Abrir popup
      const popup = window.open(
        popupUrl,
        'facebook-login',
        'width=600,height=600,scrollbars=yes,resizable=yes'
      )

      if (!popup) {
        throw new Error('Popup bloqueado pelo navegador. Permita popups para este site.')
      }

      console.log('✅ Popup aberto com sucesso')

      // Aguardar resposta do popup
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          console.log('❌ Popup fechado sem resposta')
          clearInterval(checkClosed)
          setIsConnecting(false)
          setConnectionStatus('error')
          setErrorMessage('Conexão cancelada ou falhou. Verifique se o popup não foi bloqueado.')
        }
      }, 1000)

      // Aguardar mensagem do popup
      const messageHandler = (event: MessageEvent) => {
        console.log('📨 Mensagem recebida do popup:', event.data)
        console.log('📋 Tipo da mensagem:', typeof event.data)
        console.log('📋 Conteúdo completo:', JSON.stringify(event.data, null, 2))
        console.log('🌐 Origem da mensagem:', event.origin)
        console.log('🌐 Origem atual:', window.location.origin)
        
        if (event.origin !== window.location.origin) {
          console.log('⚠️ Mensagem de origem diferente, ignorando')
          return
        }
        
        if (event.data.type === 'FACEBOOK_SUCCESS') {
          console.log('✅ Conexão Facebook bem-sucedida:', event.data.userInfo)
          clearInterval(checkClosed)
          popup.close()
          setIsConnecting(false)
          setConnectionStatus('success')
          toast.success('Conta do Facebook conectada com sucesso!')
          
          // Chamar callback de sucesso se fornecido
          if (onSuccess) {
            onSuccess([]) // Por enquanto, array vazio. Em produção, buscar contas reais
          }
          
          // Recarregar dados das contas
          setTimeout(() => {
            onClose()
            window.location.reload()
          }, 2000)
        } else if (event.data.type === 'FACEBOOK_ERROR') {
          console.error('❌ Erro na conexão Facebook:', event.data.message)
          clearInterval(checkClosed)
          popup.close()
          setIsConnecting(false)
          setConnectionStatus('error')
          setErrorMessage(event.data.message || 'Erro ao conectar com Facebook')
        } else {
          console.log('❓ Mensagem desconhecida:', event.data)
        }
      }
      
      window.addEventListener('message', messageHandler)
      
      // Cleanup function
      return () => {
        window.removeEventListener('message', messageHandler)
        clearInterval(checkClosed)
      }

    } catch (error) {
      console.error('❌ Erro ao conectar com Facebook:', error)
      setIsConnecting(false)
      setConnectionStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido')
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connecting':
        return <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />
      default:
        return <Facebook className="w-6 h-6 text-blue-500" />
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Conectando com Facebook...'
      case 'success':
        return 'Conexão realizada com sucesso!'
      case 'error':
        return 'Erro na conexão'
      default:
        return 'Conectar Conta do Facebook'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Conectar Conta do Facebook
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  {getStatusIcon()}
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {getStatusText()}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {connectionStatus === 'idle' && 
                    'Conecte sua conta do Facebook para gerenciar campanhas de anúncios.'
                  }
                  {connectionStatus === 'connecting' && 
                    'Aguarde enquanto conectamos sua conta...'
                  }
                  {connectionStatus === 'success' && 
                    'Sua conta foi conectada com sucesso!'
                  }
                  {connectionStatus === 'error' && 
                    errorMessage
                  }
                </p>
              </div>

              {connectionStatus === 'error' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                        Erro na Conexão
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {errorMessage}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                        💡 Dica: Verifique se o popup não foi bloqueado pelo navegador
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {connectionStatus === 'success' && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                        Conexão Realizada
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Sua conta do Facebook foi conectada com sucesso!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              {connectionStatus === 'idle' && (
                <>
                  <button
                    onClick={handleConnectFacebook}
                    disabled={isConnecting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <Facebook className="w-4 h-4" />
                        Conectar Facebook
                      </>
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </>
              )}

              {connectionStatus === 'error' && (
                <>
                  <button
                    onClick={handleConnectFacebook}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Facebook className="w-4 h-4" />
                    Tentar Novamente
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                  >
                    Fechar
                  </button>
                </>
              )}

              {connectionStatus === 'success' && (
                <button
                  onClick={onClose}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Continuar
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 