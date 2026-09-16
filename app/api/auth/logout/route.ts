import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  // Encerra a sessão do app (Supabase Auth) — limpa os cookies sb-* de sessão.
  const supabase = createClient()
  await supabase.auth.signOut()

  const response = NextResponse.json({ success: true })

  // Limpar cookies de autenticação do Facebook (integração, não login do app)
  response.cookies.set('fb_access_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0
  })

  response.cookies.set('fb_user_id', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0
  })

  return response
}
