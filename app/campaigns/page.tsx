'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CampaignsRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para Meta Ads (funcionalidade de campanhas) — rota antiga mantida para links/favoritos
    router.replace('/meta-ads-manager')
  }, [router])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecionando...</p>
        </div>
      </div>
    </div>
  )
}
