import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const { userId, supabase: _supabase } = await requireAuth();
    const body = (await req.json()) as {
      linkedinUrl?: string;
      vagaId?: string;
      candidateName?: string;
    };

    const admin = createSupabaseAdminClient();
    // admin-client: justified — importing candidates writes to pdf_candidates with elevated permissions
    const { data: usuario } = await _supabase.from("usuarios").select("empresa_id").eq("id", userId).single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
    }

    // If a candidate with same linkedin URL and company already exists, return it instead of inserting duplicate
    if (body.linkedinUrl) {
      const { data: existing } = await admin
        .from("pdf_candidates")
        .select("id,nome_candidato,cargo_atual,empresa_atual,cidade,score_final,linkedin_url,status,parsed_text")
        .eq("linkedin_url", body.linkedinUrl)
        .eq("empresa_id", usuario.empresa_id)
        .single();

      if (existing) {
        return NextResponse.json({ candidate: existing });
      }
    }

    const insert = {
      empresa_id: usuario.empresa_id,
      vaga_id: body.vagaId || null,
      nome_candidato: body.candidateName || "Candidato importado",
      cargo_atual: null,
      empresa_atual: null,
      cidade: null,
      linkedin_url: body.linkedinUrl || "",
      score_final: null,
      status: "triado",
    } as Record<string, unknown>;

    const { data, error } = await admin
      .from("pdf_candidates")
      .insert(insert)
      .select("id,nome_candidato,cargo_atual,empresa_atual,cidade,score_final,linkedin_url,status,parsed_text")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ candidate: data });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
