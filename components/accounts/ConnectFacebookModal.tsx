'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Facebook, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

// Declarações de tipos para o Facebook SDK
declare global {
  interface Window {
    FB: any
    fbAsyncInit: () => void
  }
}

interface ConnectFacebookModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (newAccounts: any[]) => void
}

export default function ConnectFacebookModal({ isOpen, onClose, onSuccess }: ConnectFacebookModalProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [fbInitialized, setFbInitialized] = useState(false)

  // Inicializar SDK do Facebook
  useEffect(() => {
    // Carregar SDK do Facebook
    const loadFacebookSDK = () => {
      if (window.FB) {
        setFbInitialized(true)
        return
      }

      // Adicionar o Facebook SDK para Javascript
      ;(function(d: Document, s: string, id: string) {
        var js: HTMLScriptElement, fjs = d.getElementsByTagName(s)[0] as HTMLScriptElement;
        if (d.getElementById(id)) return;
        js = d.createElement(s) as HTMLScriptElement; js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        if (fjs.parentNode) {
          fjs.parentNode.insertBefore(js, fjs);
        }
      }(document, 'script', 'facebook-jssdk'));

      // Inicializar quando o SDK carregar
      window.fbAsyncInit = function() {
        const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
        if (!appId) {
          console.error('Facebook App ID não configurado')
          return
        }

        // Inicializar o SDK com seu aplicativo e a versão da API Graph
        window.FB.init({
          appId: appId,
          xfbml: true,
          version: 'v20.0'
        });

        console.log('✅ Facebook SDK inicializado')
        setFbInitialized(true)
      };
    }

    loadFacebookSDK()
  }, [])

  const handleConnectFacebook = async () => {
    if (!fbInitialized) {
      setErrorMessage('Facebook SDK não foi inicializado. Aguarde um momento e tente novamente.')
      setConnectionStatus('error')
      return
    }

    setIsConnecting(true)
    setConnectionStatus('connecting')
    setErrorMessage('')

    try {
      console.log('🔗 Iniciando conexão com Facebook via SDK...')
      
      // Usar o SDK JavaScript do Facebook
      window.FB.login(function(response: any) {
        console.log('📨 Resposta do Facebook SDK:', response)
        
        if (response.status === 'connected') {
          console.log('✅ Login bem-sucedido!')
          console.log('🔑 Access Token:', response.authResponse.accessToken)
          console.log('👤 User ID:', response.authResponse.userID)
          
          // Obter informações do usuário
          window.FB.api('/me', {fields: 'id,name,email'}, function(userInfo: any) {
            console.log('👤 Informações do usuário:', userInfo)
            
            setIsConnecting(false)
            setConnectionStatus('success')
            toast.success('Conta do Facebook conectada com sucesso!')
            
            // Chamar callback de sucesso se fornecido
            if (onSuccess) {
              onSuccess([userInfo]) // Passar informações do usuário
            }
            
            // Recarregar dados das contas
            setTimeout(() => {
              onClose()
              window.location.reload()
            }, 2000)
          });
          
        } else {
          console.log('❌ Login cancelado ou falhou')
          setIsConnecting(false)
          setConnectionStatus('error')
          setErrorMessage('Login cancelado ou falhou. Tente novamente.')
        }
      }, {
        scope: 'ads_management,business_management,pages_show_list,pages_read_engagement,public_profile,email,pages_manage_metadata,ads_read'
      });

    } catch (error) {
      console.error('❌ Erro ao conectar com Facebook:', error)
      setIsConnecting(false)
      setConnectionStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido')
    }
  }

  const handleConnectFacebookSimple = async () => {
    if (!fbInitialized) {
      setErrorMessage('Facebook SDK não foi inicializado. Aguarde um momento e tente novamente.')
      setConnectionStatus('error')
      return
    }

    setIsConnecting(true)
    setConnectionStatus('connecting')
    setErrorMessage('')

    try {
      console.log('🔗 Iniciando conexão com Facebook via SDK (simples)...')
      
      // Usar o SDK JavaScript do Facebook com permissões básicas
      window.FB.login(function(response: any) {
        console.log('📨 Resposta do Facebook SDK (simples):', response)
        
        if (response.status === 'connected') {
          console.log('✅ Login bem-sucedido (simples)!')
          console.log('🔑 Access Token:', response.authResponse.accessToken)
          console.log('👤 User ID:', response.authResponse.userID)
          
          // Obter informações do usuário
          window.FB.api('/me', {fields: 'id,name,email'}, function(userInfo: any) {
            console.log('👤 Informações do usuário (simples):', userInfo)
            
            setIsConnecting(false)
            setConnectionStatus('success')
            toast.success('Conta do Facebook conectada com sucesso!')
            
            // Chamar callback de sucesso se fornecido
            if (onSuccess) {
              onSuccess([userInfo]) // Passar informações do usuário
            }
            
            // Recarregar dados das contas
            setTimeout(() => {
              onClose()
              window.location.reload()
            }, 2000)
          });
          
        } else {
          console.log('❌ Login cancelado ou falhou (simples)')
          setIsConnecting(false)
          setConnectionStatus('error')
          setErrorMessage('Login cancelado ou falhou. Tente novamente.')
        }
      }, {
        scope: 'public_profile,email'
      });

    } catch (error) {
      console.error('❌ Erro ao conectar com Facebook (simples):', error)
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
                {!fbInitialized && connectionStatus === 'idle' && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                    ⏳ Inicializando Facebook SDK...
                  </p>
                )}
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
                    disabled={isConnecting || !fbInitialized}
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
                    onClick={handleConnectFacebookSimple}
                    disabled={isConnecting || !fbInitialized}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Conectando (Simples)...
                      </>
                    ) : (
                      <>
                        <Facebook className="w-4 h-4" />
                        Conectar Facebook (Simples)
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