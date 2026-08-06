import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const admin = createSupabaseAdminClient();
      const user = data.user;
      const userEmail = user.email || "";
      const userName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        (userEmail ? userEmail.split("@")[0] : "Usuário");

      // 1. Busca perfil do usuário na tabela usuarios usando o admin client (sem restrições de RLS)
      const { data: usuario } = await admin
        .from("usuarios")
        .select("id, empresa_id")
        .eq("id", user.id)
        .maybeSingle();

      let empresaId = usuario?.empresa_id;

      // 2. Se o usuário ainda não tiver empresa_id associado, cria a empresa e atualiza a tabela usuarios
      if (!empresaId) {
        const empresaNome = user.user_metadata?.empresa || `Empresa de ${userName}`;
        const { data: novaEmpresa } = await admin
          .from("empresas")
          .insert({
            nome: empresaNome,
            plano: "trial",
            subscription_status: "trialing",
            trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            limite_pdfs_mes: 15,
            limite_buscas_linkedin: 3,
            creditos_pdfs_usados: 0,
            creditos_buscas_usados: 0,
          })
          .select("id")
          .single();

        if (novaEmpresa?.id) {
          empresaId = novaEmpresa.id;
          await admin.from("usuarios").upsert(
            {
              id: user.id,
              empresa_id: empresaId,
              nome: userName,
              email: userEmail,
              cargo: user.user_metadata?.cargo || "Recrutador",
              role: "admin",
            },
            { onConflict: "id" }
          );
        }
      }

      // 3. Marca onboarding_completed: true no user_metadata para o middleware não bloquear acessos
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          onboarding_completed: true,
        },
      });

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=N%C3%A3o%20foi%20poss%C3%ADvel%20autenticar%20com%20o%20Google.`
  );
}
