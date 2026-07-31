import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// 1. GET: Retorna as etiquetas da empresa
export async function GET() {
  try {
    const { supabase, userId } = await requireAuth();

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    const empresaId = usuario?.empresa_id;
    if (!empresaId) {
      return NextResponse.json({ etiquetas: [] });
    }

    // Rate limiting: 60 req/min por empresa
    const rl = await checkRateLimit(`empresa:${empresaId}:etiquetas:get`, 60, 60_000);
    if (!rl.ok) {
      return NextResponse.json({ error: "Rate limit atingido" }, { status: 429 });
    }

    const { data, error } = await supabase
      .from("etiquetas")
      .select("id,nome,cor,posicao")
      .eq("empresa_id", empresaId)
      .order("posicao", { ascending: true });

    if (error) {
      logger.error("[etiquetas] GET Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ etiquetas: data || [] });
  } catch (err: unknown) {
    logger.error("Erro em GET /api/etiquetas", err);
    return NextResponse.json({ error: "Erro ao carregar etiquetas" }, { status: 500 });
  }
}

// 2. POST: Cria uma nova etiqueta para a empresa
export async function POST(req: Request) {
  try {
    const { supabase, userId } = await requireAuth();

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    const empresaId = usuario?.empresa_id;
    if (!empresaId) {
      return NextResponse.json({ error: "Empresa não associada ao usuário." }, { status: 403 });
    }

    const { nome, cor, posicao } = (await req.json()) as { nome?: string; cor?: string; posicao?: number };
    if (!nome || !cor) {
      return NextResponse.json({ error: "Nome e Cor são obrigatórios." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("etiquetas")
      .insert({
        empresa_id: empresaId,
        nome: nome.trim(),
        cor: cor.trim(),
        posicao: posicao || 0,
      })
      .select()
      .single();

    if (error) {
      logger.error("[etiquetas] POST Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ etiqueta: data });
  } catch (err: unknown) {
    logger.error("Erro em POST /api/etiquetas", err);
    return NextResponse.json({ error: "Erro ao criar etiqueta" }, { status: 500 });
  }
}

// 3. PATCH: Atualiza uma etiqueta existente
export async function PATCH(req: Request) {
  try {
    const { supabase, userId } = await requireAuth();

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    const empresaId = usuario?.empresa_id;
    if (!empresaId) {
      return NextResponse.json({ error: "Empresa não associada ao usuário." }, { status: 403 });
    }

    const { id, nome, cor, posicao } = (await req.json()) as {
      id?: string;
      nome?: string;
      cor?: string;
      posicao?: number;
    };

    if (!id) {
      return NextResponse.json({ error: "ID da etiqueta é obrigatório para atualização." }, { status: 400 });
    }

    const updatePayload: any = {};
    if (nome !== undefined) updatePayload.nome = nome.trim();
    if (cor !== undefined) updatePayload.cor = cor.trim();
    if (posicao !== undefined) updatePayload.posicao = posicao;

    const { data, error } = await supabase
      .from("etiquetas")
      .update(updatePayload)
      .eq("id", id)
      .eq("empresa_id", empresaId) // Garante o escopo de segurança da empresa
      .select()
      .single();

    if (error) {
      logger.error("[etiquetas] PATCH Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ etiqueta: data });
  } catch (err: unknown) {
    logger.error("Erro em PATCH /api/etiquetas", err);
    return NextResponse.json({ error: "Erro ao atualizar etiqueta" }, { status: 500 });
  }
}

// 4. DELETE: Remove uma etiqueta existente
export async function DELETE(req: Request) {
  try {
    const { supabase, userId } = await requireAuth();

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    const empresaId = usuario?.empresa_id;
    if (!empresaId) {
      return NextResponse.json({ error: "Empresa não associada ao usuário." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID da etiqueta é obrigatório." }, { status: 400 });
    }

    const { error } = await supabase
      .from("etiquetas")
      .delete()
      .eq("id", id)
      .eq("empresa_id", empresaId);

    if (error) {
      logger.error("[etiquetas] DELETE Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    logger.error("Erro em DELETE /api/etiquetas", err);
    return NextResponse.json({ error: "Erro ao excluir etiqueta" }, { status: 500 });
  }
}
