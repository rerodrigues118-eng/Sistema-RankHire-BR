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
  const { id, role, ativo } = body;

  if (!id) {
    return NextResponse.json({ error: "ID do administrador é obrigatório." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (role !== undefined) updates.role = role;
  if (ativo !== undefined) updates.ativo = ativo;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhum campo válido enviado." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: before } = await admin.from("admin_usuarios").select("*").eq("id", id).single();

  if (!before) {
    return NextResponse.json({ error: "Administrador não encontrado." }, { status: 404 });
  }

  const { error } = await admin.from("admin_usuarios").update(updates).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction({
    adminId: session.admin_id,
    acao: "admin_usuario_atualizado",
    nivel: "INFO",
    dadosAntes: before,
    dadosDepois: updates,
  });

  return NextResponse.json({ success: true });
}
