import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type RawCrit = { id: string; nome?: string | null; peso?: number | null; description?: string | null; weight?: number | null };

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, supabase: _supabase } = await requireAuth();
    const { id: vagaId } = await params;

    // Use authenticated supabase for company-scoped criteria operations
    const { data: usuario } = await _supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const { data: vaga } = await _supabase
      .from("vagas")
      .select("id")
      .eq("id", vagaId)
      .eq("empresa_id", usuario.empresa_id)
      .single();

    if (!vaga) {
      return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });
    }

    const { data: rawCriteria, error } = await _supabase
      .from("criteria")
      .select("id, nome, peso, description, weight")
      .eq("vaga_id", vagaId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Normalize: support legacy rows that use description/weight instead of nome/peso
    type RawCrit = { id: string; nome?: string | null; peso?: number | null; description?: string | null; weight?: number | null };
    const criteria = ((rawCriteria || []) as RawCrit[]).map((c: RawCrit) => ({
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
    const { userId, supabase: _supabase } = await requireAuth();
    const { id: vagaId } = await params;
    const body = (await req.json()) as {
      criteria: { id?: string; nome: string; peso: number }[];
    };

    if (!Array.isArray(body.criteria)) {
      return NextResponse.json({ error: "Critérios inválidos" }, { status: 400 });
    }

    // Check ownership with authenticated supabase
    const { data: usuario } = await _supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const { data: vaga } = await _supabase
      .from("vagas")
      .select("id")
      .eq("id", vagaId)
      .eq("empresa_id", usuario.empresa_id)
      .single();

    if (!vaga) {
      return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });
    }

    // Fetch existing criteria
    const { data: existingCriteria } = await _supabase
      .from("criteria")
      .select("id")
      .eq("vaga_id", vagaId);

    const existingIds = ((existingCriteria || []) as { id: string }[]).map((c) => c.id);
    const newIds = body.criteria.map((c) => c.id).filter(Boolean) as string[];

    // Identify criteria to delete
    const idsToDelete = existingIds.filter((id) => !newIds.includes(id));

    // Delete removed criteria
    if (idsToDelete.length > 0) {
      // 1. Delete evaluations for removed criteria
      await _supabase
        .from("candidate_evaluations")
        .delete()
        .in("criteria_id", idsToDelete);

      // 2. Delete criteria
      const { error: deleteError } = await _supabase
        .from("criteria")
        .delete()
        .in("id", idsToDelete);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
    }

    // Insert or update criteria
    for (const crit of body.criteria) {
      if (!crit.nome.trim()) continue;
      const peso = Math.max(1, Math.min(5, crit.peso));

      if (crit.id) {
        // Update
        await _supabase
          .from("criteria")
          .update({ nome: crit.nome.trim(), peso })
          .eq("id", crit.id)
          .eq("vaga_id", vagaId);
      } else {
        // Insert
        await _supabase
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
    const { data: rawUpdated } = await _supabase
      .from("criteria")
      .select("id, nome, peso, description, weight")
      .eq("vaga_id", vagaId)
      .order("created_at", { ascending: true });

    // Normalize: support legacy rows that use description/weight instead of nome/peso
    const updatedCriteria = ((rawUpdated || []) as RawCrit[]).map((c: RawCrit) => ({
      id: c.id,
      nome: c.nome || c.description || "",
      peso: c.peso ?? c.weight ?? 3,
    }));

    return NextResponse.json({ criteria: updatedCriteria });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
