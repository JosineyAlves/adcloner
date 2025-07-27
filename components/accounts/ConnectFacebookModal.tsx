'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Facebook, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ConnectFacebookModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (userInfo: any) => void
}

export default function ConnectFacebookModal({ isOpen, onClose, onSuccess }: ConnectFacebookModalProps) {
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Verificar se SDK está carregado
  const isSDKReady = () => {
    try {
      const isReady = typeof window !== 'undefined' && window.FB
      console.log('🔍 SDK Status:', isReady ? 'Pronto' : 'Não carregado')
      return isReady
    } catch (error) {
      console.error('❌ Erro ao verificar SDK:', error)
      return false
    }
  }

  // Verificar status de login
  const checkLoginStatus = () => {
    try {
      if (!isSDKReady()) {
        console.log('SDK não está pronto')
        return
      }

      window.FB.getLoginStatus((response: any) => {
        console.log('Status de login:', response)
        
        if (response.status === 'connected') {
          console.log('Usuário já está conectado')
          handleLoginSuccess(response.authResponse)
        }
      })
    } catch (error) {
      console.error('Erro ao verificar status de login:', error)
    }
  }

  // Fazer login com Facebook usando Login para Empresas
  const handleConnectFacebook = async () => {
    try {
      if (!isSDKReady()) {
        setErrorMessage('SDK do Facebook não está carregado. Recarregue a página.')
        setConnectionStatus('error')
        return
      }

      setIsConnecting(true)
      setConnectionStatus('connecting')
      setErrorMessage('')

      console.log('🔗 Iniciando login com Facebook SDK (Login para Empresas)...')

      // Usar config_id para Login para Empresas (Nova configuração)
      const configId = '757815830318736' // Nova configuração correta
      
      console.log('🔧 Usando Config ID:', configId)

      window.FB.login((response: any) => {
        try {
          console.log('Resposta do login:', response)

          if (response.authResponse && response.authResponse.code) {
            console.log('✅ Login bem-sucedido! Código recebido:', response.authResponse.code)
            handleLoginSuccess(response.authResponse)
          } else {
            console.log('❌ Login cancelado ou falhou')
            setIsConnecting(false)
            setConnectionStatus('error')
            setErrorMessage('Login cancelado ou falhou. Tente novamente.')
          }
        } catch (error) {
          console.error('Erro no callback do login:', error)
          setIsConnecting(false)
          setConnectionStatus('error')
          setErrorMessage('Erro interno no login. Tente novamente.')
        }
      }, {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true
      })

    } catch (error) {
      console.error('❌ Erro ao conectar com Facebook:', error)
      setIsConnecting(false)
      setConnectionStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido')
    }
  }

  // Processar sucesso do login
  const handleLoginSuccess = async (authResponse: any) => {
    try {
      console.log('🎉 Processando sucesso do login...')
      console.log('Auth Response:', authResponse)
      
      // Verificar se temos o código de autorização
      if (!authResponse || !authResponse.code) {
        throw new Error('Código de autorização não recebido')
      }
      
      console.log('📤 Enviando código para servidor...')
      
      // Enviar código para servidor para trocar por token
      const response = await fetch('/api/auth/callback/facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authResponse.code })
      })
      
      if (!response.ok) {
        throw new Error('Erro ao processar código no servidor')
      }
      
      const data = await response.json()
      console.log('✅ Resposta do servidor:', data)
      
      if (data.success) {
        setIsConnecting(false)
        setConnectionStatus('success')
        toast.success('Conta do Facebook conectada com sucesso!')
        
        // Chamar callback de sucesso com dados do sistema
        if (onSuccess) {
          const systemUserInfo = {
            accessToken: data.access_token,
            clientBusinessId: data.client_business_id,
            systemUserId: data.system_user_id,
            type: 'system_user_token'
          }
          onSuccess(systemUserInfo)
        }
        
        // Fechar modal após delay
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        throw new Error(data.error || 'Erro desconhecido no servidor')
      }

    } catch (error) {
      console.error('❌ Erro ao processar login:', error)
      setIsConnecting(false)
      setConnectionStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao processar login')
    }
  }

  // Verificar status quando modal abrir
  useEffect(() => {
    try {
      if (isOpen && isSDKReady()) {
        checkLoginStatus()
      }
    } catch (error) {
      console.error('Erro ao verificar status de login:', error)
    }
  }, [isOpen])

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
                    disabled={!isSDKReady()}
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