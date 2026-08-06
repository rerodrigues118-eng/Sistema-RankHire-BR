import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user has completed profile (empresa_id, cargo, and telefone)
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("empresa_id, cargo, telefone")
        .eq("id", data.user.id)
        .single();

      // If new Google user without empresa_id, cargo or telefone, send to onboarding to complete setup
      if (!usuario || !usuario.empresa_id || !usuario.cargo || !usuario.telefone) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=N%C3%A3o%20foi%20poss%C3%ADvel%20autenticar%20com%20o%20Google.`
  );
}
