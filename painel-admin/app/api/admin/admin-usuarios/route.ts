import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminAction } from "@/lib/log";

const ALLOWED_ROLES = ["readonly", "suporte", "financeiro", "administrador", "superadmin"];

export async function POST(request: Request) {
  const auth = await requireAdmin("administrador");
  if (auth.error) return auth.error;

  const currentAdmin = auth.admin;
  const body = await request.json();
  const { nome, email, senha, role } = body;

  if (!email || !senha || !role) {
    return NextResponse.json({ error: "Email, senha e role são obrigatórios." }, { status: 400 });
  }

  if (typeof email !== "string" || typeof senha !== "string" || typeof role !== "string") {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Role inválida." }, { status: 400 });
  }

  if (role === "superadmin" && currentAdmin.role !== "superadmin") {
    return NextResponse.json({ error: "Apenas superadmin pode criar superadmins." }, { status: 403 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin
    .from("admin_usuarios")
    .select("id")
    .eq("email", normalizedEmail)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Já existe um administrador com esse email." }, { status: 400 });
  }

  const { hashSync } = await import("bcryptjs");
  const senha_hash = hashSync(senha, 10);

  const { data: created, error } = await admin
    .from("admin_usuarios")
    .insert({
      nome: nome || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      senha_hash,
      role,
      ativo: true,
    })
    .select("id,nome,email,role,ativo")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message || "Falha ao criar administrador." }, { status: 500 });
  }

  await logAdminAction({
    adminId: currentAdmin.id,
    acao: "admin_usuario_criado",
    nivel: "INFO",
    dadosAntes: null,
    dadosDepois: created,
  });

  return NextResponse.json({ admin: created });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin("administrador");
  if (auth.error) return auth.error;

  const currentAdmin = auth.admin;
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

  if (updates.role === "superadmin" && currentAdmin.role !== "superadmin") {
    return NextResponse.json({ error: "Apenas superadmin pode promover outros usuários a superadmin." }, { status: 403 });
  }

  if (updates.ativo === false && body.id === currentAdmin.id) {
    return NextResponse.json({ error: "Não é permitido desativar a própria conta." }, { status: 403 });
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
    adminId: currentAdmin.id,
    acao: "admin_usuario_atualizado",
    nivel: "INFO",
    dadosAntes: before,
    dadosDepois: updates,
  });

  return NextResponse.json({ success: true });
}
