import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { createSupabaseAdminClient } from "@/lib/admin";
import { handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const admin = createSupabaseAdminClient();

    const { data: usuario } = await admin.from("usuarios").select("empresa_id").eq("id", userId).single();
    if (!usuario?.empresa_id) {
      return NextResponse.json({ config: null });
    }

    const { data: config } = await admin
      .from("integracoes_config")
      .select("*")
      .eq("empresa_id", usuario.empresa_id)
      .maybeSingle();

    return NextResponse.json({
      config: config || {
        google_calendar_connected: false,
        auto_generate_meet: true,
        sync_events: true,
        weekly_email_backup: false,
        export_format: "csv",
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();
    const body = await req.json();
    const admin = createSupabaseAdminClient();

    const { data: usuario } = await admin.from("usuarios").select("empresa_id").eq("id", userId).single();
    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const { data: updated, error } = await admin.from("integracoes_config").upsert({
      empresa_id: usuario.empresa_id,
      user_id: userId,
      google_calendar_connected: body.google_calendar_connected ?? false,
      auto_generate_meet: body.auto_generate_meet ?? true,
      sync_events: body.sync_events ?? true,
      weekly_email_backup: body.weekly_email_backup ?? false,
      export_format: body.export_format || "csv",
      updated_at: new Date().toISOString(),
    }, { onConflict: "empresa_id,user_id" }).select("*").single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ config: updated });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
