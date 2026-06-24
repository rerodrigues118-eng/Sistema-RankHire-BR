import { createClient as createAdminClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/auth-guard";

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new ApiError("Supabase admin nao configurado.", 500);
  }

  return createAdminClient(url, serviceRoleKey);
}

export async function requireAdminContext() {
  const { userId } = await requireSuperAdmin();

  return {
    userId,
    admin: createSupabaseAdminClient(),
  };
}

export async function logAdminAction(input: {
  adminId: string;
  empresaId?: string | null;
  acao: string;
  detalhes?: Record<string, unknown>;
}) {
  const admin = createSupabaseAdminClient();

  await admin.from("admin_logs").insert({
    admin_id: input.adminId,
    empresa_id: input.empresaId ?? null,
    acao: input.acao,
    detalhes: input.detalhes ?? {},
  });
}
