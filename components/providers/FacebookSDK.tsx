'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    FB: any
    fbAsyncInit: () => void
  }
}

export default function FacebookSDK() {
  const [isLoaded, setIsLoaded] = useState<boolean>(false)
  const [hasError, setHasError] = useState<boolean>(false)

  useEffect(() => {
    // Verificar se já foi carregado
    if (typeof window === 'undefined') return

    // Verificar se já existe
    if (window.FB) {
      console.log('✅ Facebook SDK já carregado')
      setIsLoaded(true)
      return
    }

    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
    
    if (!appId) {
      console.error('❌ NEXT_PUBLIC_FACEBOOK_APP_ID não configurado')
      setHasError(true)
      return
    }

    console.log('🔧 Iniciando carregamento do Facebook SDK...')

    // Configurar fbAsyncInit antes de carregar o script
    window.fbAsyncInit = function() {
      try {
        console.log('🔧 Inicializando Facebook SDK com App ID:', appId)

        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v20.0'
        })

        console.log('✅ Facebook SDK inicializado com sucesso')
        setIsLoaded(true)
        setHasError(false)
      } catch (error) {
        console.error('❌ Erro ao inicializar SDK do Facebook:', error)
        setHasError(true)
        setIsLoaded(false)
      }
    }

    // Função para carregar o script
    const loadFacebookSDK = () => {
      try {
        // Verificar se já existe um script do Facebook
        const existingScript = document.querySelector('script[src*="connect.facebook.net"]')
        if (existingScript) {
          console.log('📝 Script do Facebook já existe, aguardando inicialização...')
          return
        }

        console.log('📥 Carregando script do Facebook...')
        
        const script = document.createElement('script')
        script.src = 'https://connect.facebook.net/en_US/sdk.js'
        script.async = true
        script.defer = true
        script.crossOrigin = 'anonymous'
        
        script.onload = () => {
          console.log('✅ Script do Facebook carregado com sucesso')
        }
        
        script.onerror = (error) => {
          console.error('❌ Erro ao carregar script do Facebook:', error)
          setHasError(true)
          setIsLoaded(false)
        }
        
        document.head.appendChild(script)
      } catch (error) {
        console.error('❌ Erro ao carregar SDK do Facebook:', error)
        setHasError(true)
        setIsLoaded(false)
      }
    }

    // Carregar SDK
    loadFacebookSDK()

    // Verificar periodicamente se o SDK foi carregado
    const checkSDKLoaded = () => {
      if (window.FB) {
        console.log('✅ Facebook SDK detectado como carregado')
        setIsLoaded(true)
        setHasError(false)
        return
      }
      
      // Continuar verificando por até 10 segundos
      setTimeout(checkSDKLoaded, 500)
    }

    // Iniciar verificação após 1 segundo
    setTimeout(checkSDKLoaded, 1000)

    return () => {
      // Cleanup se necessário
    }
  }, [])

  // Log de status para debugging
  useEffect(() => {
    if (isLoaded) {
      console.log('✅ Facebook SDK carregado com sucesso')
    }
    if (hasError) {
      console.error('❌ Erro ao carregar Facebook SDK')
    }
  }, [isLoaded, hasError])

  return null
} 