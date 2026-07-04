import { cookies, NextResponse } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { getAdminSessionByToken, getSessionCookieName } from "@/lib/session";
import { logAdminAction } from "@/lib/log";

const COOKIE_NAME = "rankhire_admin_impersonation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const empresaId = url.searchParams.get("empresaId");
  const stop = url.searchParams.get("stop") === "1";
  const redirect = url.searchParams.get("redirect") || "/admin/clientes";
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? request.headers.get("x-real-ip") ?? null;

  const token = cookies().get(getSessionCookieName())?.value;
  if (!token) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const session = await getAdminSessionByToken(token);
  if (!session) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const adminClient = createSupabaseAdminClient();
  const { data: adminUser, error: adminError } = await adminClient
    .from("admin_usuarios")
    .select("id,nome,email,role,ativo")
    .eq("id", session.admin_id)
    .single();

  if (adminError || !adminUser || !adminUser.ativo) {
    return NextResponse.json({ error: "Administrador inválido ou inativo." }, { status: 403 });
  }

  const response = NextResponse.redirect(new URL(redirect, request.url));

  if (stop || !empresaId) {
    response.cookies.delete(COOKIE_NAME, { path: "/" });
    await logAdminAction({
      adminId: session.admin_id,
      acao: "impersonacao_terminada",
      nivel: "INFO",
      empresaId: empresaId || null,
      dadosAntes: { impersonacaoCookie: empresaId || null },
      dadosDepois: { action: "stop", redirect, adminRole: adminUser.role, adminEmail: adminUser.email },
      ipAddress,
    });
    return response;
  }

  const { data: empresa, error } = await adminClient.from("empresas").select("id").eq("id", empresaId).single();

  if (error || !empresa) {
    return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
  }

  response.cookies.set({
    name: COOKIE_NAME,
    value: empresaId,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60,
  });

  await logAdminAction({
    adminId: session.admin_id,
    acao: "impersonacao_iniciada",
    nivel: "INFO",
    empresaId,
    dadosAntes: { impersonacaoCookie: null },
    dadosDepois: { action: "start", redirect, adminRole: adminUser.role, adminEmail: adminUser.email },
    ipAddress,
  });

  return response;
}
