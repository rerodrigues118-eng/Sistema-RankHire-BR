import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { getAdminSessionByToken, getSessionCookieName } from "@/lib/session";

export type Role = "superadmin" | "administrador" | "financeiro" | "suporte" | "readonly";

const ROLE_HIERARCHY: Record<Role, number> = {
  superadmin: 5,
  administrador: 4,
  financeiro: 3,
  suporte: 2,
  readonly: 1,
};

export async function requireAdmin(minRole: Role = "readonly") {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!token) {
    return {
      error: NextResponse.json({ error: "Não autorizado" }, { status: 401 }),
      admin: null,
    };
  }

  const session = await getAdminSessionByToken(token);
  if (!session) {
    return {
      error: NextResponse.json({ error: "Sessão inválida" }, { status: 401 }),
      admin: null,
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data: admin, error } = await supabase
    .from("admin_usuarios")
    .select("id,nome,email,role,ativo")
    .eq("id", session.admin_id)
    .single();

  if (error || !admin || !admin.ativo) {
    return {
      error: NextResponse.json({ error: "Administrador inválido ou inativo." }, { status: 403 }),
      admin: null,
    };
  }

  if (ROLE_HIERARCHY[admin.role as Role] < ROLE_HIERARCHY[minRole]) {
    return {
      error: NextResponse.json({ error: "Permissão insuficiente" }, { status: 403 }),
      admin: null,
    };
  }

  return { error: null, admin };
}
