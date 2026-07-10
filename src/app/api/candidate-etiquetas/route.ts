import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const { supabase: _supabase, userId } = await requireAuth();
    const admin = createSupabaseAdminClient();
    // admin-client: justified — writes to candidate_etiquetas and etiqueta validation require elevated permissions
    const body = await req.json();
    const schema = z.object({ candidateId: z.string().uuid(), etiquetaId: z.string().uuid().nullable().optional() });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
    const { candidateId, etiquetaId } = parsed.data;

    if (!candidateId) return NextResponse.json({ error: "candidateId é obrigatório" }, { status: 400 });

    // verificar empresa do usuário
    const { data: usuario } = await _supabase.from("usuarios").select("empresa_id").eq("id", userId).single();
    const empresaId = usuario?.empresa_id;

    // rate limit: 30 req/min por empresa para operações em candidatos
    if (empresaId) {
      const rl = await checkRateLimit(`empresa:${empresaId}:candidates`, 30, 60_000);
      if (!rl.ok) return NextResponse.json({ error: "Rate limit atingido" }, { status: 429 });
    }

    // validar candidate pertence à mesma empresa
    const { data: candidate } = await admin.from("pdf_candidates").select("id,empresa_id").eq('empresa_id', empresaId).eq("id", candidateId).single();
    if (!candidate) return NextResponse.json({ error: "Candidato não encontrado" }, { status: 404 });
    if (candidate.empresa_id !== empresaId) return NextResponse.json({ error: "Acesso negado ao candidato" }, { status: 403 });

    // se etiquetaId informado, validar pertence à mesma empresa
    if (etiquetaId) {
      const { data: etiqueta } = await admin.from("etiquetas").select("id,empresa_id").eq("id", etiquetaId).single();
      if (!etiqueta) return NextResponse.json({ error: "Etiqueta não encontrada" }, { status: 404 });
      if (etiqueta.empresa_id !== empresaId) return NextResponse.json({ error: "Acesso negado à etiqueta" }, { status: 403 });
    }

    // Regra: apenas 1 etiqueta por candidate. Remove anteriores.
    await admin.from("candidate_etiquetas").delete().eq("candidate_id", candidateId);

    if (etiquetaId) {
      const { data: inserted, error: insertErr } = await admin.from("candidate_etiquetas").insert({ candidate_id: candidateId, etiqueta_id: etiquetaId, aplicado_por: userId }).select("id").single();
      if (insertErr) throw insertErr;
      return NextResponse.json({ ok: true, id: inserted?.id });
    }

    // If no etiquetaId provided, we treated it as removal above.
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    logger.error("Erro em POST /api/candidate-etiquetas", err);
    return NextResponse.json({ error: (err as Error).message || "Erro" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { supabase: _supabase } = await requireAuth();
    const admin = createSupabaseAdminClient();
    const url = new URL(req.url);
    const candidateId = url.searchParams.get("candidateId");
    if (!candidateId) return NextResponse.json({ error: "candidateId é obrigatório" }, { status: 400 });

    // rate limit per candidate read (company-neutral small limit)
    // attempt to infer empresa via candidate
    try {
      const { data: candidateData } = await admin.from('pdf_candidates').select('empresa_id').eq('id', candidateId).single();
      const localEmpresaId = candidateData?.empresa_id;
      if (localEmpresaId) {
        const rl = await checkRateLimit(`empresa:${localEmpresaId}:candidates_read`, 120, 60_000);
        if (!rl.ok) return NextResponse.json({ error: 'Rate limit atingido' }, { status: 429 });
      }
    } catch {}

    const { data, error } = await admin
      .from("candidate_etiquetas")
      .select("id,etiqueta_id,etiquetas(id,nome,cor,posicao)")
      .eq("candidate_id", candidateId)
      .limit(1);

    if (error) throw error;
    return NextResponse.json({ assignment: (data && data[0]) || null });
  } catch (err: unknown) {
    logger.error("Erro em GET /api/candidate-etiquetas", err);
    return NextResponse.json({ error: (err as Error).message || "Erro" }, { status: 500 });
  }
}
