import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const admin = createSupabaseAdminClient();
      const user = data.user;
      const userEmail = user.email || "";
      const userName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        (userEmail ? userEmail.split("@")[0] : "Usuário");

      // 1. Busca perfil do usuário na tabela usuarios usando o admin client
      const { data: usuario } = await admin
        .from("usuarios")
        .select("id, empresa_id, cargo, telefone, onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      let empresaId = usuario?.empresa_id;
      let isNewUser = false;

      // 2. Se o usuário ainda não tiver empresa_id associada, cria a empresa e salva em usuarios
      if (!empresaId) {
        isNewUser = true;
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

      // 3. Marca onboarding_completed: true no user_metadata para o middleware liberar navegação
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          onboarding_completed: true,
        },
      });

      // 4. Lógica de redirecionamento:
      // Se for novo usuário sem empresa cadastrada, direciona para o onboarding. Caso contrário, entra no dashboard.
      if (isNewUser || !empresaId) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=N%C3%A3o%20foi%20poss%C3%ADvel%20autenticar%20com%20o%20Google.`
  );
}
