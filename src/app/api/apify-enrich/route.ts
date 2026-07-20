import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { getRedisConnection } from "@/lib/queue";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();

    const { linkedinUrl, vagaId, candidateName } = (await req.json()) as {
      linkedinUrl?: string;
      vagaId?: string;
      candidateName?: string;
    };

    if (!linkedinUrl || !vagaId) {
      return NextResponse.json(
        { error: "URL do LinkedIn e ID da vaga sao obrigatorios" },
        { status: 400 },
      );
    }

    // ── Valida ownership da vaga ──────────────────────────────────────
    const admin = createSupabaseAdminClient();
    const { data: usuario } = await admin
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .single();

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const { data: vaga } = await admin
      .from("vagas")
      .select("id, empresa_id")
      .eq("id", vagaId)
      .single();

    if (!vaga || vaga.empresa_id !== usuario.empresa_id) {
      return NextResponse.json({ error: "Vaga não encontrada ou não pertence à sua empresa" }, { status: 403 });
    }

    // ── Rate limit: 10 enriquecimentos por empresa por minuto ─────────
    const rl = await checkRateLimit(`apify-enrich:${usuario.empresa_id}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Limite de enriquecimentos excedido (máximo 10/min). Aguarde." },
        { status: 429 },
      );
    }

    const conn = getRedisConnection();
    if (!conn) {
      return NextResponse.json(
        { error: "Serviço de fila não disponível (Redis não configurado)" },
        { status: 503 },
      );
    }

    const { Queue } = await import("bullmq");
    const enrichmentQueue = new Queue("linkedin-enrichment", { connection: conn as never });

    const batchId = `apify-${Date.now()}`;

    await enrichmentQueue.add(
      "enrich-profile",
      {
        linkedinUrl,
        vagaId,
        batchId,
        candidateName,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    );

    await enrichmentQueue.close();

    return NextResponse.json({ success: true, batchId, message: "Enriquecimento na fila." });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
