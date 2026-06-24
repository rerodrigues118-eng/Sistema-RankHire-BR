import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId, supabase } = await requireAuth();
    const { data: usuario } = await supabase.from("usuarios").select("empresa_id").eq("id", userId).single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ candidates: [] });
    }

    const { data, error } = await supabase
      .from("pdf_candidates")
      .select("id,nome_candidato,cargo_atual,empresa_atual,cidade,score_final,linkedin_url,status,parsed_text")
      .eq("empresa_id", usuario.empresa_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ candidates: data || [] });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const { userId, supabase } = await requireAuth();
    const body = (await req.json()) as {
      name?: string;
      role?: string;
      company?: string;
      city?: string;
      linkedinUrl?: string;
      score?: number;
      status?: string;
    };

    const { data: usuario } = await supabase.from("usuarios").select("empresa_id").eq("id", userId).single();
    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa nao encontrada" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("pdf_candidates")
      .insert({
        empresa_id: usuario.empresa_id,
        nome_candidato: body.name || "Candidato",
        cargo_atual: body.role || "",
        empresa_atual: body.company || "",
        cidade: body.city || "",
        linkedin_url: body.linkedinUrl || "",
        score_final: body.score ?? null,
        status: body.status || "triado",
      })
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
