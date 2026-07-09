import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, supabase } = await requireAuth();
    const { id } = await params;
    const body = (await req.json()) as Partial<{
      title: string;
      area: string;
      contract: string;
      location: string;
      briefing: string;
      status: string;
    }>;

    const { data: usuario } = await supabase.from("usuarios").select("empresa_id").eq("id", userId).single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
    }

    const update = {
      titulo: body.title,
      title: body.title,
      area: body.area,
      tipo_contrato: body.contract,
      localizacao: body.location,
      briefing: body.briefing,
      status: body.status === "completed" ? "completed" : body.status === "paused" ? "pausada" : body.status === "active" ? "ativa" : undefined,
      updated_at: new Date().toISOString(),
    };

    const cleanUpdate = Object.fromEntries(Object.entries(update).filter(([, value]) => value !== undefined));

    const admin = await import('@/lib/admin').then(m => m.createSupabaseAdminClient());
    const { data, error } = await admin
      .from("vagas")
      .update(cleanUpdate)
      .eq("id", id)
      .eq("empresa_id", usuario.empresa_id)
      .select("id,titulo,area,tipo_contrato,localizacao,briefing,status,created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vaga: data });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
