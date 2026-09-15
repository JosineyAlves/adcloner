'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Tela "Contas" removida do menu (set/2026, seção 40 do doc do projeto) — duplicava a listagem
// de contas de anúncio já disponível em "Integrações" (perfis → drill-down por perfil), sem
// nenhuma ação de remover conta/perfil própria, e herdava um bug de fallback que fazia contas já
// desconectadas continuarem aparecendo aqui sem forma de limpá-las. Não é possível excluir este
// arquivo remotamente nesta máquina (sem operação de delete disponível), então a rota /accounts
// vira um redirecionamento para /meta-accounts, cobrindo acessos diretos por URL/favoritos
// antigos — em vez de deixar a tela duplicada acessível por fora do menu.
export default function AccountsPageRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/meta-accounts')
  }, [router])

  return null
}
