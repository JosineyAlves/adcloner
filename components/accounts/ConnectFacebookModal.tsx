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

  // Fazer login com Facebook usando OAuth clássico (redirect_uri explícito), NÃO o SDK JS
  // e NÃO "Login para Empresas".
  //
  // Por quê (ver seções 38 e 39 do doc do projeto):
  // - "Login para Empresas" (window.FB.login com config_id) força uma tela de seleção de
  //   "ativos" configurada previamente no App Dashboard da Meta — se essa config exige
  //   Página/Pixel (como a antiga, ver NEXT_PUBLIC_FACEBOOK_CONFIG_ID_CLONE), contas
  //   restritas sem Página/Pixel disponível ficam travadas.
  // - window.FB.login com `scope` (sem config_id) evita a tela de ativos, mas o código de
  //   autorização gerado pelo SDK JS fica amarrado a um redirect_uri interno que o SDK
  //   escolhe sozinho — o backend não consegue reproduzir esse redirect_uri na troca do
  //   código por token, e a Meta rejeita com "Error validating verification code".
  // - A correção (seção 39): navegar manualmente pra /dialog/oauth com um redirect_uri
  //   explícito e controlado por nós (mesmo endpoint do handler GET desta rota), abrindo
  //   em popup e recebendo o resultado via postMessage — exatamente o padrão usado pelo
  //   tracker de terceiros do usuário, que também não usa o SDK JS do Facebook.
  const handleConnectFacebook = async () => {
    try {
      setIsConnecting(true)
      setConnectionStatus('connecting')
      setErrorMessage('')

      const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
      const appUrl = process.env.NEXT_PUBLIC_APP_URL

      if (!appId || !appUrl) {
        setErrorMessage('Configuração do Facebook incompleta (App ID ou URL ausente).')
        setConnectionStatus('error')
        setIsConnecting(false)
        return
      }

      // Permissões mínimas pra ler estrutura de negócio/contas e editar status/orçamento —
      // nada de pages_show_list/pixel, que só fariam sentido pra "Clonar Campanhas" (não
      // implementada ainda, ver seção 37).
      const scope = 'ads_management,ads_read,business_management,public_profile'
      const redirectUri = `${appUrl}/api/auth/callback/facebook`

      const oauthUrl =
        `https://www.facebook.com/v23.0/dialog/oauth` +
        `?client_id=${encodeURIComponent(appId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(scope)}` +
        `&response_type=code` +
        `&display=popup`

      console.log('🔗 Abrindo popup OAuth clássico (redirect_uri explícito):', oauthUrl)

      const popup = window.open(oauthUrl, 'facebook-login', 'width=600,height=700')

      if (!popup) {
        setErrorMessage('O popup foi bloqueado pelo navegador. Permita popups para este site e tente novamente.')
        setConnectionStatus('error')
        setIsConnecting(false)
        return
      }

      const handleMessage = (event: MessageEvent) => {
        if (!event.data || typeof event.data !== 'object') return

        if (event.data.type === 'FACEBOOK_SUCCESS') {
          clearInterval(popupCheckInterval)
          window.removeEventListener('message', handleMessage)
          handleLoginSuccess(event.data)
        } else if (event.data.type === 'FACEBOOK_ERROR') {
          clearInterval(popupCheckInterval)
          window.removeEventListener('message', handleMessage)
          setIsConnecting(false)
          setConnectionStatus('error')
          setErrorMessage(event.data.message || 'Erro ao conectar com Facebook.')
        }
      }

      // Detectar se o usuário fechou o popup manualmente sem concluir o login
      const popupCheckInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupCheckInterval)
          window.removeEventListener('message', handleMessage)
          setIsConnecting(current => {
            if (current) {
              setConnectionStatus('error')
              setErrorMessage('Login cancelado: o popup foi fechado antes de concluir a conexão.')
            }
            return false
          })
        }
      }, 500)

      window.addEventListener('message', handleMessage)

    } catch (error) {
      console.error('❌ Erro ao conectar com Facebook:', error)
      setIsConnecting(false)
      setConnectionStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido')
    }
  }

  // Processar sucesso do login — recebido via postMessage do popup (handler GET da rota de
  // callback, que já trocou o code por token, persistiu a conexão no Supabase e setou o
  // cookie httpOnly; ver seção 39 do doc do projeto). Diferente do fluxo antigo (SDK JS +
  // POST), aqui não fazemos mais uma segunda troca de código no client.
  const handleLoginSuccess = (data: { userInfo?: any; accessToken?: string }) => {
    try {
      console.log('🎉 Processando sucesso do login (via postMessage):', data)

      setIsConnecting(false)
      setConnectionStatus('success')
      toast.success('Conta do Facebook conectada com sucesso!')

      if (onSuccess) {
        onSuccess({
          accessToken: data.accessToken,
          userId: data.userInfo?.id,
          userName: data.userInfo?.name,
          type: 'user_token'
        })
      }

      // Fechar modal após delay
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (error) {
      console.error('❌ Erro ao processar login:', error)
      setIsConnecting(false)
      setConnectionStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao processar login')
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
                {connectionStatus !== 'idle' && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {connectionStatus === 'connecting' && 'Aguarde enquanto conectamos sua conta...'}
                    {connectionStatus === 'success' && 'Sua conta foi conectada com sucesso!'}
                    {connectionStatus === 'error' && errorMessage}
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