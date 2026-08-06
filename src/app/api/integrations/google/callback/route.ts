import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { createSupabaseAdminClient } from "@/lib/admin";

export async function GET(req: Request) {
  try {
    const { userId } = await requireAuth();
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(new URL("/configuracoes/integracoes?error=no_code", req.url));
    }

    const admin = createSupabaseAdminClient();
    const { data: usuario } = await admin.from("usuarios").select("empresa_id").eq("id", userId).single();

    if (usuario?.empresa_id) {
      await admin.from("integracoes_config").upsert({
        empresa_id: usuario.empresa_id,
        user_id: userId,
        google_calendar_connected: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "empresa_id,user_id" });
    }

    return NextResponse.redirect(new URL("/configuracoes/integracoes?success=google_connected", req.url));
  } catch {
    return NextResponse.redirect(new URL("/configuracoes/integracoes?error=failed", req.url));
  }
}
