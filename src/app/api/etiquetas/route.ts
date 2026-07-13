import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const { supabase: _supabase, userId } = await requireAuth();
    // Use authenticated supabase for company-scoped etiquetas

    // get user's empresa_id
    const { data: usuario } = await _supabase.from("usuarios").select("empresa_id").eq("id", userId).single();
    const empresaId = usuario?.empresa_id;

    if (!empresaId) {
      return NextResponse.json({ etiquetas: [] });
    }

    // rate limit: 60 req/min por empresa para buscas de etiquetas
    if (empresaId) {
      const rl = await checkRateLimit(`empresa:${empresaId}:etiquetas`, 60, 60_000);
      if (!rl.ok) return NextResponse.json({ error: 'Rate limit atingido' }, { status: 429 });
    }

    const { data, error } = await _supabase
      .from("etiquetas")
      .select("id,nome,cor,posicao")
      .eq("empresa_id", empresaId)
      .order("posicao", { ascending: true });

    if (error) {
      logger.error('[etiquetas] Supabase error:', error);
      throw new Error(`Erro ao buscar etiquetas: ${error.message}`);
    }

    return NextResponse.json({ etiquetas: data || [] });
  } catch (err: unknown) {
    logger.error("Erro em GET /api/etiquetas", err);
    const message = err instanceof Error ? err.message : "Erro ao carregar etiquetas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
