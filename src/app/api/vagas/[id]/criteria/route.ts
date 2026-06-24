import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, supabase } = await requireAuth();
    const { id: vagaId } = await params;

    // Check if the vacancy belongs to the user's company
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const { data: vaga } = await supabase
      .from("vagas")
      .select("id")
      .eq("id", vagaId)
      .eq("empresa_id", usuario.empresa_id)
      .single();

    if (!vaga) {
      return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });
    }

    const { data: rawCriteria, error } = await supabase
      .from("criteria")
      .select("id, nome, peso, description, weight")
      .eq("vaga_id", vagaId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Normalize: support legacy rows that use description/weight instead of nome/peso
    const criteria = (rawCriteria || []).map((c) => ({
      id: c.id,
      nome: c.nome || c.description || "",
      peso: c.peso ?? c.weight ?? 3,
    }));

    return NextResponse.json({ criteria });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, supabase } = await requireAuth();
    const { id: vagaId } = await params;
    const body = (await req.json()) as {
      criteria: { id?: string; nome: string; peso: number }[];
    };

    if (!Array.isArray(body.criteria)) {
      return NextResponse.json({ error: "Critérios inválidos" }, { status: 400 });
    }

    // Check if the vacancy belongs to the user's company
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const { data: vaga } = await supabase
      .from("vagas")
      .select("id")
      .eq("id", vagaId)
      .eq("empresa_id", usuario.empresa_id)
      .single();

    if (!vaga) {
      return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });
    }

    // Fetch existing criteria
    const { data: existingCriteria } = await supabase
      .from("criteria")
      .select("id")
      .eq("vaga_id", vagaId);

    const existingIds = (existingCriteria || []).map((c) => c.id);
    const newIds = body.criteria.map((c) => c.id).filter(Boolean) as string[];

    // Identify criteria to delete
    const idsToDelete = existingIds.filter((id) => !newIds.includes(id));

    if (idsToDelete.length > 0) {
      // 1. Delete evaluations for removed criteria
      await supabase
        .from("candidate_evaluations")
        .delete()
        .in("criteria_id", idsToDelete);

      // 2. Delete criteria
      await supabase
        .from("criteria")
        .delete()
        .in("id", idsToDelete);
    }

    // Insert or update criteria
    for (const crit of body.criteria) {
      if (!crit.nome.trim()) continue;
      const peso = Math.max(1, Math.min(5, crit.peso));

      if (crit.id) {
        // Update
        await supabase
          .from("criteria")
          .update({ nome: crit.nome.trim(), peso })
          .eq("id", crit.id)
          .eq("vaga_id", vagaId);
      } else {
        // Insert
        await supabase
          .from("criteria")
          .insert({
            vaga_id: vagaId,
            nome: crit.nome.trim(),
            peso,
            gerado_por_ia: false,
          });
      }
    }

    // Fetch updated criteria to return
    const { data: rawUpdated } = await supabase
      .from("criteria")
      .select("id, nome, peso, description, weight")
      .eq("vaga_id", vagaId)
      .order("created_at", { ascending: true });

    // Normalize: support legacy rows that use description/weight instead of nome/peso
    const updatedCriteria = (rawUpdated || []).map((c) => ({
      id: c.id,
      nome: c.nome || c.description || "",
      peso: c.peso ?? c.weight ?? 3,
    }));

    return NextResponse.json({ criteria: updatedCriteria });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
