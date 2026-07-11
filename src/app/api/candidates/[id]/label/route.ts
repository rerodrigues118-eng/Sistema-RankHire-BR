import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: Request, { params }: Params) {
  try {
    const { userId, supabase: _supabase } = await requireAuth();
    const { id: candidateId } = await params;
    const { etiquetaId } = (await req.json()) as { etiquetaId?: string | null };

    const { data: usuario } = await _supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa nao encontrada." }, { status: 404 });
    }

    const { data: candidate } = await _supabase
      .from("pdf_candidates")
      .select("id,empresa_id")
      .eq("id", candidateId)
      .eq("empresa_id", usuario.empresa_id)
      .single();

    if (!candidate) {
      return NextResponse.json({ error: "Candidato nao encontrado." }, { status: 404 });
    }

    if (!etiquetaId) {
      const { error } = await _supabase
        .from("candidate_etiquetas")
        .delete()
        .eq("candidate_id", candidateId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ etiqueta: null });
    }

    const { data: etiqueta, error: etiquetaError } = await _supabase
      .from("etiquetas")
      .select("id,nome,cor,posicao,empresa_id")
      .eq("id", etiquetaId)
      .eq("empresa_id", usuario.empresa_id)
      .single();

    if (etiquetaError || !etiqueta) {
      return NextResponse.json({ error: "Etiqueta nao encontrada." }, { status: 404 });
    }

    const { error } = await _supabase
      .from("candidate_etiquetas")
      .upsert(
        {
          candidate_id: candidateId,
          etiqueta_id: etiqueta.id,
          aplicado_por: userId,
        },
        { onConflict: "candidate_id" },
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      etiqueta: {
        id: etiqueta.id,
        nome: etiqueta.nome,
        cor: etiqueta.cor,
        posicao: etiqueta.posicao,
      },
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
