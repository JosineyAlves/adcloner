import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente Supabase para uso no browser (Client Components) — usa a anon key
 * pública. É este client que faz login/logout do usuário do app
 * (signInWithPassword, signOut, signUp): essas operações rodam no navegador
 * para o Supabase gerenciar a sessão via cookies (lidos/renovados pelo
 * middleware em middleware.ts).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
