import { cookies, NextResponse } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { getAdminSessionByToken, getSessionCookieName } from "@/lib/session";
import { logAdminAction } from "@/lib/log";

export async function PATCH(request: Request) {
  const token = cookies().get(getSessionCookieName())?.value;
  if (!token) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const session = await getAdminSessionByToken(token);
  if (!session) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const body = await request.json();
  const { chave, valor } = body;

  if (!chave || typeof valor !== "string") {
    return NextResponse.json({ error: "Chave e valor são obrigatórios." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: before } = await admin.from("configuracoes_globais").select("*").eq("chave", chave).single();
  const { error } = await admin.from("configuracoes_globais").upsert({ chave, valor, descricao: before?.descricao ?? null, updated_by: session.admin_id, updated_at: new Date().toISOString() });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction({
    adminId: session.admin_id,
    acao: "configuracao_atualizada",
    nivel: "INFO",
    dadosAntes: before,
    dadosDepois: { chave, valor },
  });

  return NextResponse.json({ success: true });
}
