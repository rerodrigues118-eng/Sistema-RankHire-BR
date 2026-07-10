import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type CalibrationInput = {
  linkedinUrl: string;
  decisao: "aprovado" | "rejeitado" | "pulado";
  dadosPerfil?: Record<string, unknown>;
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, supabase: _supabase } = await requireAuth();
    const admin = createSupabaseAdminClient();
    // admin-client: justified — inserting calibrations and updating agent counters across company
    const { id } = await params;
    const body = (await req.json()) as { calibracoes?: CalibrationInput[] };

    const { data: usuario } = await _supabase.from("usuarios").select("empresa_id").eq("id", userId).single();
    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
    }

    if (!Array.isArray(body.calibracoes) || body.calibracoes.length === 0) {
      return NextResponse.json({ error: "Nenhuma calibracao enviada" }, { status: 400 });
    }

    const rows = body.calibracoes.map((calibracao) => ({
      agente_id: id,
      linkedin_url: calibracao.linkedinUrl,
      decisao: calibracao.decisao,
      dados_perfil: calibracao.dadosPerfil || {},
    }));

    const { data, error } = await admin
      .from("agente_calibracoes")
      .insert(rows)
      .select("id,agente_id,linkedin_url,decisao,created_at");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { error: updateError } = await admin
      .from("agentes_ia")
      .update({
        calibracoes_realizadas: body.calibracoes.length,
      })
      .eq("id", id)
      .eq("empresa_id", usuario.empresa_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ calibracoes: data || [] });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
