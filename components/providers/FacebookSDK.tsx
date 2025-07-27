'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    FB: any
    fbAsyncInit: () => void
  }
}

export default function FacebookSDK() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Verificar se já foi carregado
    if (typeof window === 'undefined') return

    // Verificar se já existe
    if (window.FB) {
      setIsLoaded(true)
      return
    }

    // Carregar SDK do Facebook
    const loadFacebookSDK = () => {
      try {
        const script = document.createElement('script')
        script.src = 'https://connect.facebook.net/en_US/sdk.js'
        script.async = true
        script.defer = true
        script.crossOrigin = 'anonymous'
        
        script.onload = () => {
          console.log('Script do Facebook carregado')
        }
        
        script.onerror = () => {
          console.error('Erro ao carregar script do Facebook')
          setHasError(true)
        }
        
        document.head.appendChild(script)
      } catch (error) {
        console.error('Erro ao carregar SDK do Facebook:', error)
        setHasError(true)
      }
    }

    // Inicializar SDK
    window.fbAsyncInit = function() {
      try {
        const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
        
        if (!appId) {
          console.error('NEXT_PUBLIC_FACEBOOK_APP_ID não configurado')
          setHasError(true)
          return
        }

        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v20.0' // Usar versão compatível
        })

        console.log('Facebook SDK inicializado')
        setIsLoaded(true)
      } catch (error) {
        console.error('Erro ao inicializar SDK do Facebook:', error)
        setHasError(true)
      }
    }

    // Carregar SDK se ainda não foi carregado
    if (!document.querySelector('script[src*="connect.facebook.net"]')) {
      loadFacebookSDK()
    } else {
      // Se o script já existe, verificar se FB está disponível
      const checkFB = () => {
        if (window.FB) {
          setIsLoaded(true)
        } else {
          setTimeout(checkFB, 100)
        }
      }
      checkFB()
    }

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