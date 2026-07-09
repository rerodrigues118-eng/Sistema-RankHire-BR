import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/auth-guard";
import { getRedisConnection } from "@/lib/queue";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await requireAuth();
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

    const conn = getRedisConnection();
    if (!conn) {
      return NextResponse.json(
        { error: "Serviço de fila não disponível (Redis não configurado)" },
        { status: 503 },
      );
    }

    const { Queue } = await import("bullmq");
    const enrichmentQueue = new Queue("linkedin-enrichment", { connection: conn as any });

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

