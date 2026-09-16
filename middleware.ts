import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Roda em tudo, exceto:
     * - arquivos internos do Next (_next/static, _next/image)
     * - o favicon e demais imagens estáticas em /public
     * Isso cobre tanto as páginas quanto as rotas de API (app/api/**),
     * exceto as listadas como públicas em lib/supabase/middleware.ts.
     */
    '/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
