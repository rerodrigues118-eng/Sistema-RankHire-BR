import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { userId, supabase } = await requireAuth();
    const url = new URL(req.url);
    const vagaId = url.searchParams.get("vaga_id");

    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    if (usuarioError || !usuario?.empresa_id) {
      return NextResponse.json({ candidates: [] });
    }

    let query = supabase
      .from("pdf_candidates")
      .select(
        `id,nome_candidato,cargo_atual,empresa_atual,cidade,email_contato,telefone,score_final,linkedin_url,status,file_url,storage_path,parsed_text,pretensao_salarial,disponibilidade,regime_preferido,resumo_ia,created_at`
      )
      .eq("empresa_id", usuario.empresa_id)
      .order("created_at", { ascending: false });

    if (vagaId) {
      query = query.eq("vaga_id", vagaId);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ candidates: data || [] });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
