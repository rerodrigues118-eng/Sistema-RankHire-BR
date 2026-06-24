import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Rota de bootstrap única — define o superadmin no banco
// Acesse: /api/setup-superadmin
export async function GET() {
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

  return NextResponse.json({
    success: true,
    message: "✅ Superadmin configurado! Recarregue o sistema (F5) para ver o botão do Painel Admin na Sidebar.",
    usuario: user.email,
    role: "superadmin",
  });
}
