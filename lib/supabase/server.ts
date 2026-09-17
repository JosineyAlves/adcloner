import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cliente Supabase para uso em Server Components, Route Handlers e Server
 * Actions — lê/escreve a sessão do usuário a partir dos cookies da request
 * (os mesmos que o middleware.ts mantém atualizados). Usa a anon key
 * pública; para operações que precisam ignorar RLS, continue usando
 * lib/supabase-admin.ts (service role key).
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Chamado a partir de um Server Component (sem permissão de escrita
            // de cookie) — inofensivo enquanto o middleware.ts renovar a sessão
            // a cada request.
          }
        },
      },
    }
  )
}

/**
 * Retorna o id (auth.users.id) do usuário vmetrics autenticado na sessão atual, ou null se não
 * houver sessão válida. Usado pelas rotas de API do Meta Business (e pela camada
 * lib/meta-connections.ts) para checar posse de conexões/contas — o middleware.ts já bloqueia
 * requests sem sessão nas rotas não-públicas, mas essa checagem aqui é uma segunda camada:
 * garante que um usuário logado só acesse os PRÓPRIOS ativos conectados, nunca os de outro
 * cliente.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}
