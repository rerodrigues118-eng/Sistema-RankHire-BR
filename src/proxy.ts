import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match most request paths, but exclude public routes and static assets.
     */
    '/((?!_next/static|_next/image|favicon.ico|login|auth|cadastro|onboarding|lgpd|privacidade|termos|fotos-site|api/pagarme/webhook|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
