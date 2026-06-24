import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET() {
  try {
    const { supabase, userId } = await requireAuth();

    // get user's empresa_id
    const { data: usuario } = await supabase.from("usuarios").select("empresa_id").eq("id", userId).single();
    const empresaId = usuario?.empresa_id;

    if (!empresaId) {
      return NextResponse.json({ etiquetas: [] });
    }

    // rate limit: 60 req/min por empresa para buscas de etiquetas
    if (empresaId) {
      const rl = checkRateLimit(`empresa:${empresaId}:etiquetas`, 60, 60_000);
      if (!rl.ok) return NextResponse.json({ error: 'Rate limit atingido' }, { status: 429 });
    }

    const { data, error } = await supabase
      .from("etiquetas")
      .select("id,nome,cor,posicao")
      .eq("empresa_id", empresaId)
      .order("posicao", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ etiquetas: data || [] });
  } catch (err: unknown) {
    console.error("Erro em GET /api/etiquetas", err);
    return NextResponse.json({ error: (err as Error).message || "Erro" }, { status: 500 });
  }
}
