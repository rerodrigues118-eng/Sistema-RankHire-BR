import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Minimal middleware adding recommended security headers.
// Extend this to implement route protection (authentication) as needed.
export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  res.headers.set('Referrer-Policy', 'no-referrer')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Permissions-Policy', 'interest-cohort=()')
  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
