'use client'

import { useEffect, useState } from 'react'

// Resultado em memória do módulo: a Sidebar remonta a cada navegação, e sem isso o item
// "Notificações" piscaria (some e reaparece) a cada troca de página.
let cached: boolean | null = null

// true só se o usuário logado está em SALES_NOTIFY_EMAILS (GET /api/notifications?access=1).
export function useSalesNotifyAccess(): boolean {
  const [allowed, setAllowed] = useState<boolean>(cached === true)

  useEffect(() => {
    if (cached !== null) return
    let active = true
    fetch('/api/notifications?access=1', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { allowed: false }))
      .then((d) => {
        cached = d?.allowed === true
        if (active) setAllowed(cached)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return allowed
}
