/**
 * Cliente Supabase server-side, com a service_role key (ignora RLS).
 *
 * ⚠️ NUNCA importar este arquivo em código que roda no browser — a service_role key
 * dá acesso total ao banco. Use apenas dentro de app/api/** (Route Handlers) ou de
 * outros módulos server-only como lib/meta-connections.ts.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let cachedClient: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedClient) return cachedClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.'
    )
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return cachedClient
}
