import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/log";

export async function PATCH(request: Request) {
  const auth = await requireAdmin("suporte");
  if (auth.error) return auth.error;

  const adminUser = auth.admin;
  const body = await request.json();
  const { chave, valor } = body;

  if (!chave || typeof valor !== "string") {
    return NextResponse.json({ error: "Chave e valor são obrigatórios." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: before } = await supabase.from("configuracoes_globais").select("*").eq("chave", chave).single();
  const { error } = await supabase.from("configuracoes_globais").upsert({ chave, valor, descricao: before?.descricao ?? null, updated_by: adminUser.id, updated_at: new Date().toISOString() });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction({
    adminId: adminUser.id,
    acao: "configuracao_atualizada",
    nivel: "INFO",
    dadosAntes: before,
    dadosDepois: { chave, valor },
  });

  return NextResponse.json({ success: true });
}
