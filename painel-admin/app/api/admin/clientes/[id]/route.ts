import { cookies, NextResponse } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { getAdminSessionByToken, getSessionCookieName } from "@/lib/session";
import { logAdminAction } from "@/lib/log";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const token = cookies().get(getSessionCookieName())?.value;
  if (!token) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const session = await getAdminSessionByToken(token);
  if (!session) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  const validFields = ["status", "plano", "notas_internas", "motivo_suspensao"];

  for (const field of validFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
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
    adminId: session.admin_id,
    acao: "empresa_atualizada",
    nivel: "INFO",
    empresaId: params.id,
    dadosAntes: before,
    dadosDepois: updates,
  });

  return NextResponse.json({ success: true });
}
