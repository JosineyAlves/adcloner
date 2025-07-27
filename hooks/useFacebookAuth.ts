'use client'

import { useState, useEffect } from 'react'

interface UseFacebookAuthReturn {
  isSDKReady: boolean
  isLoggedIn: boolean
  userInfo: any
  login: () => Promise<void>
  logout: () => Promise<void>
  getUserInfo: () => Promise<any>
}

export function useFacebookAuth(): UseFacebookAuthReturn {
  const [isSDKReady, setIsSDKReady] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState(null)

  useEffect(() => {
    const checkSDK = () => {
      if (typeof window !== 'undefined' && window.FB) {
        setIsSDKReady(true)
        checkLoginStatus()
      } else {
        setTimeout(checkSDK, 100)
      }
    }

    checkSDK()
  }, [])

  const checkLoginStatus = () => {
    if (!window.FB) return

    window.FB.getLoginStatus((response: any) => {
      setIsLoggedIn(response.status === 'connected')
      if (response.status === 'connected') {
        getUserInfo()
      }
    })
  }

  const getUserInfo = async () => {
    if (!window.FB) return null

    return new Promise((resolve) => {
      window.FB.api('/me', { fields: 'id,name,email' }, (response: any) => {
        setUserInfo(response)
        resolve(response)
      })
    })
  }

  const login = async (): Promise<void> => {
    if (!window.FB) throw new Error('SDK não está pronto')

    const configId = process.env.NEXT_PUBLIC_FACEBOOK_CONFIG_ID
    
    if (!configId) {
      throw new Error('Config ID não configurado')
    }

    return new Promise<void>((resolve, reject) => {
      window.FB.login((response: any) => {
        if (response.status === 'connected') {
          setIsLoggedIn(true)
          getUserInfo()
          resolve()
        } else {
          reject(new Error('Login falhou'))
        }
      }, {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true
      })
    })
  }

  const logout = async (): Promise<void> => {
    if (!window.FB) return

    return new Promise<void>((resolve) => {
      window.FB.logout(() => {
        setIsLoggedIn(false)
        setUserInfo(null)
        resolve()
      })
    })
  }

  return {
    isSDKReady,
    isLoggedIn,
    userInfo,
    login,
    logout,
    getUserInfo
  }
} 