import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rotas acessíveis sem estar logado no app. As rotas de OAuth do Facebook
// (/api/auth/facebook*, /api/auth/callback/facebook) continuam liberadas aqui
// de propósito: são a integração com o Facebook, não o login do app — quem as
// aciona já deveria estar logado, mas mantê-las fora da lista evita qualquer
// risco de quebrar o fluxo de conexão de contas hoje em produção.
// /api/meta/sync removido daqui junto com a rota (app/api/meta/sync/route.ts) e o cron em
// vercel.json — pipeline de sync sem nenhum consumidor, ver claude/estado-integracao-facebook.md.
const PUBLIC_PATHS = ['/login', '/register', '/api/auth', '/api/cron']

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: não remover — renova o token de sessão do Supabase a cada
  // request (getUser valida contra o servidor, ao contrário de getSession).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = ''
    return NextResponse.redirect(loginUrl)
  }

  if (user && (pathname === '/login' || pathname === '/register')) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    dashboardUrl.search = ''
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}
