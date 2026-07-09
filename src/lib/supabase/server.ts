import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function createClient() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
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
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return supabase
  }

  const admin = createAdminClient(url, serviceRoleKey)

  const proxiedSupabase = new Proxy(supabase, {
    get(target, prop, receiver) {
      if (prop === 'from') {
        return (relation: string) => {
          if (relation === 'usuarios' || relation === 'empresas') {
            return admin.from(relation)
          }
          return target.from(relation)
        }
      }
      return Reflect.get(target, prop, receiver)
    }
  })

  return proxiedSupabase as unknown as ReturnType<typeof createServerClient>
}
