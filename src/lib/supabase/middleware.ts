import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rotas acessíveis sem login
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/cadastro',
  '/onboarding',
  '/lgpd',
  '/privacidade',
  '/termos',
  '/fotos-site',
  '/api/pagarme/webhook',
  '/api/email/unsubscribe',
  '/api/auth',
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/') || pathname.startsWith(route + '?')
  )
}

/**
 * Atualiza a sessão Supabase e redireciona usuários não autenticados.
 * ATENÇÃO: este middleware roda no Edge Runtime — não use Node.js APIs,
 * módulos nativos ou o cliente admin do Supabase aqui.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Se as variáveis de ambiente não estiverem configuradas, deixa passar
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
  })

  // Atualiza o token de sessão (não remova — mantém o cookie fresco)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Bloquear rota /admin legada
  if (pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Redirecionar usuário não autenticado para /login
  if (!user && !isPublicRoute(pathname) && !pathname.startsWith('/api/')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

