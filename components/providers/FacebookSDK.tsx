'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    FB: any
    fbAsyncInit: () => void
  }
}

export default function FacebookSDK() {
  useEffect(() => {
    // Carregar SDK do Facebook
    const loadFacebookSDK = () => {
      const script = document.createElement('script')
      script.src = 'https://connect.facebook.net/en_US/sdk.js'
      script.async = true
      script.defer = true
      script.crossOrigin = 'anonymous'
      document.head.appendChild(script)
    }

    // Inicializar SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v20.0' // Usar versão compatível
      })

      console.log('Facebook SDK inicializado')
    }

    // Carregar SDK se ainda não foi carregado
    if (!document.querySelector('script[src*="connect.facebook.net"]')) {
      loadFacebookSDK()
    }

    return () => {
      // Cleanup se necessário
    }
  }, [])

  return null
} 