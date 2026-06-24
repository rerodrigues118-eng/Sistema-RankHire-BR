import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_EMAIL_ALLOWLIST = new Set([
  "delski.contato@gmail.com",
]);

function normalizeRole(role: string | null | undefined) {
  return String(role || "").trim().toLowerCase();
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublicRoute = 
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/login') || 
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/cadastro') ||
    request.nextUrl.pathname.startsWith('/onboarding') ||
    request.nextUrl.pathname.startsWith('/lgpd') ||
    request.nextUrl.pathname.startsWith('/privacidade') ||
    request.nextUrl.pathname.startsWith('/termos') ||
    request.nextUrl.pathname.startsWith('/fotos-site') ||
    request.nextUrl.pathname.startsWith('/api/pagarme/webhook');

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Verificação de Billing (Acesso ao Sistema)
  if (
    user && 
    !isPublicRoute &&
    !request.nextUrl.pathname.startsWith('/configuracoes/plano') &&
    !request.nextUrl.pathname.startsWith('/sys-control') &&
    !request.nextUrl.pathname.startsWith('/api')
  ) {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: usuario } = await admin
      .from('usuarios')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (usuario?.empresa_id) {
      const { data: empresa } = await admin
        .from('empresas')
        .select('plano, subscription_status, trial_expires_at')
        .eq('id', usuario.empresa_id)
        .single()

      if (empresa) {
        let bloqueado = false;

        if (empresa.subscription_status === 'canceled' || empresa.subscription_status === 'ended') {
          bloqueado = true;
        } else if (empresa.plano === 'trial') {
          const expirou = new Date(empresa.trial_expires_at) < new Date();
          if (expirou) bloqueado = true;
        }

        if (bloqueado) {
          const url = request.nextUrl.clone()
          url.pathname = '/configuracoes/plano'
          return NextResponse.redirect(url)
        }
      }
    }
  }

  // Bloquear rota /admin legada — redireciona para home sem revelar que existe algo ali
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Painel Admin Seguro — /sys-control — usa service role para ignorar RLS
  if (user && request.nextUrl.pathname.startsWith('/sys-control')) {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: usuario } = await admin
      .from('usuarios')
      .select('role')
      .eq('id', user.id)
      .single()

    const email = user.email?.toLowerCase() || '';
    const isAllowedEmail = email ? ADMIN_EMAIL_ALLOWLIST.has(email) : false;
    const role = normalizeRole(usuario?.role);

    if ((!usuario && !isAllowedEmail) || (!isAllowedEmail && role !== 'superadmin' && role !== 'admin')) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
