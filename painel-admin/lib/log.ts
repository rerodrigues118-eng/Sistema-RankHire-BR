import { createSupabaseAdminClient } from "@/lib/supabase";

export async function logAdminAction(input: {
  adminId?: string | null;
  acao: string;
  nivel?: string;
  empresaId?: string | null;
  dadosAntes?: unknown;
  dadosDepois?: unknown;
  ipAddress?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  await admin.from("admin_logs").insert({
    admin_id: input.adminId ?? null,
    acao: input.acao,
    nivel: input.nivel ?? "INFO",
    empresa_id: input.empresaId ?? null,
    dados_antes: input.dadosAntes ?? {},
    dados_depois: input.dadosDepois ?? {},
    ip_address: input.ipAddress ?? null,
  });
}
