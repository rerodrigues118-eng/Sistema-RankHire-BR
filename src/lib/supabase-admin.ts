import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Factory function que retorna um novo cliente admin do Supabase.
 * Inicialização lazy: só cria o cliente quando chamado, evitando
 * crash no build quando as variáveis de ambiente não estão disponíveis.
 */
export function createSupabaseAdminClient(): SupabaseClient {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY

	if (!url || !key) {
		throw new Error('[supabase-admin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
	}

	return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * Instância compartilhada — lazy-loaded na primeira chamada.
 * Use createSupabaseAdminClient() para um cliente isolado por request.
 */
let _adminInstance: SupabaseClient | null = null

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
	get(_target, prop) {
		if (!_adminInstance) {
			_adminInstance = createSupabaseAdminClient()
		}
		const val = (_adminInstance as unknown as Record<string | symbol, unknown>)[prop]
		return typeof val === 'function' ? val.bind(_adminInstance) : val
	},
})

