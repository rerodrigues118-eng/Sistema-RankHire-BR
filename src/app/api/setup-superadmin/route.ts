import { requireAuth } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Rota de bootstrap única — define o superadmin no banco
// Acesse: /api/setup-superadmin
export async function GET() {
  const { userId, supabase: authSupabase } = await requireAuth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  // 1. Verifica quem está autenticado usando o client normal (respeita cookies)
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Você precisa estar logado para usar esta rota." }, { status: 401 });
  }

  // 2. Apenas o e-mail autorizado pode executar este bootstrap
  if (user.email !== "delski.contato@gmail.com") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  // 3. Usa o client ADMIN (service role) que ignora o RLS completamente
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 4. Faz upsert do usuário com role=superadmin, sem trigger de RLS
  const { error: upsertError } = await adminClient
    .from("usuarios")
    .upsert(
      { id: user.id, email: user.email, role: "superadmin" },
      { onConflict: "id" }
    );

  if (upsertError) {
    return NextResponse.json({
      error: "Erro ao definir superadmin.",
      detail: upsertError.message,
    }, { status: 500 });
  }

  // 5. Atualiza a empresa do admin para plano Pro (tudo ilimitado)
  const { data: usuario } = await adminClient
    .from("usuarios")
    .select("empresa_id")
    .eq("id", user.id)
    .single();

  if (usuario?.empresa_id) {
    await adminClient
      .from("empresas")
      .update({
        plano: "pro",
        subscription_status: "active",
        limite_pdfs_mes: 9999,
        limite_buscas_linkedin: 9999,
        trial_expires_at: null,
      })
      .eq("id", usuario.empresa_id);
  }

  return NextResponse.json({
    success: true,
    message: "✅ Superadmin configurado com plano Pro! Recarregue o sistema (F5) para ver as mudanças.",
    usuario: user.email,
    role: "superadmin",
    plano: "pro",
  });
}
