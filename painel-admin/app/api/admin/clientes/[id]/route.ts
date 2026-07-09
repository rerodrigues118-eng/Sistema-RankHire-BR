import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/log";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin("suporte");
  if (auth.error) return auth.error;

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  const validFields = [
    "nome",
    "cnpj",
    "segmento",
    "tamanho",
    "plano",
    "status",
    "trial_expires_at",
    "admin_email",
    "mrr_centavos",
    "notas_internas",
    "motivo_suspensao",
    "subscription_status",
  ];

  for (const field of validFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  // Normalize types
  if (updates.mrr_centavos !== undefined) {
    updates.mrr_centavos = Number(updates.mrr_centavos) || 0;
  }
  if (updates.trial_expires_at !== undefined) {
    const d = new Date(String(updates.trial_expires_at));
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: "trial_expires_at inválido." }, { status: 400 });
    }
    updates.trial_expires_at = d.toISOString();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhum campo válido enviado." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: before } = await admin.from("empresas").select("*").eq("id", params.id).single();

  if (!before) {
    return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
  }

  const { error } = await admin.from("empresas").update(updates).eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction({
    adminId: auth.admin.id,
    acao: "empresa_atualizada",
    nivel: "INFO",
    empresaId: params.id,
    dadosAntes: before,
    dadosDepois: updates,
  });

  return NextResponse.json({ success: true });
}
