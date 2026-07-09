import { createClient, SupabaseClient } from '@supabase/supabase-js'

const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!adminUrl || !serviceKey) {
	console.warn('[supabase-admin] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing')
}

export const supabaseAdmin: SupabaseClient = createClient(adminUrl, serviceKey, {
	auth: { persistSession: false },
})

/**
 * Factory function that returns a fresh admin client.
 * Identical to supabaseAdmin but lets routes call createSupabaseAdminClient()
 * as a function, matching the pattern used in @/lib/admin.
 */
export function createSupabaseAdminClient(): SupabaseClient {
	if (!adminUrl || !serviceKey) {
		throw new Error('[supabase-admin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
	}
	return createClient(adminUrl, serviceKey, { auth: { persistSession: false } })
}
