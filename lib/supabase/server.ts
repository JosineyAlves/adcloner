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
